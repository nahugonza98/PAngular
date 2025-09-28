// ==== IMPORTS PRINCIPALES ====
// Angular Core, Forms y Common para construcción del componente
// Firebase Auth y Database para autenticación y base de datos en tiempo real
// Función personalizada getFirebase() para inicializar Firebase manualmente


import { Component, OnDestroy, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { getFirebase } from '../../firebase.init';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  Auth
} from 'firebase/auth';
import {
  ref as dbRef,
  onValue,
  off,
  update,
  push,
  query,
  orderByChild,
  Database,
  get
} from 'firebase/database';


// ==== Tipos y estructuras de datos del chat ====
// UsersMap: Mapea el UID de cada usuario con su nombre, email y rol (? = opcional) 
// ChatMsg: Representa un mensaje individual del chat, con ID único, texto, autor y timestamp

type UsersMap = Record<string, { displayName?: string; email?: string; role?: 'user' | 'admin' | 'moderator' }>;


// ==== Interfaz ChatMsg ====
// Define la estructura de un mensaje del chat.
// Esta interfaz asegura tipado fuerte, autocompletado, y coherencia entre los datos que se envían y los que se muestran.

interface ChatMsg {
  id: string;
  uid: string;
  text: string;
  timestamp: number;
}

// ==== Decorador del componente Chat ====
// Define el componente Angular con:
// - selector: nombre personalizado para usar en HTML (<app-chat>)
// - standalone: permite que funcione sin estar en un NgModule
// - imports: módulos que necesita (ngIf, ngFor, formularios reactivos, etc.)
// - templateUrl: ruta al archivo HTML que define la interfaz del componente
// - styleUrls: ruta al archivo CSS con los estilos del componente

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

// ==== Clase del componente Chat ==== 
// Implementa OnInit, OnDestroy y AfterViewInit para manejar el ciclo de vida del componente
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  isLoggedIn = false;
  currentUid: string | null = null;

  loginForm: FormGroup;
  form: FormGroup;
  loadingLogin = false;
  loginErrorMsg = '';

  chats: ChatMsg[] = [];
  usersMap: UsersMap = {};


  // Propiedades o Metodos que solo pueden ser accedidos dentro de esta clase
  private auth!: Auth;
  private db: Database | null = null;


  // Referencias a funciones de limpieza para subscripciones

  //“Tengo una propiedad llamada authUnsub que va a guardar una función (de tipo () => void) que probablemente use más adelante para cancelar una suscripción. 
  // Por ahora no está definida, así que le doy el valor null.”
  private authUnsub: (() => void) | null = null;
  private usersOff: (() => void) | null = null;
  private msgsOff: (() => void) | null = null;

  // Referencia al contenedor de mensajes para hacer scroll automático
  @ViewChild('historyRef') historyRef!: ElementRef<HTMLDivElement>;

  // Constructor: inicializa formularios reactivos para login y envío de mensajes
  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      username: ['', [Validators.minLength(3), Validators.maxLength(24)]]
    });

    this.form = this.fb.group({
      message: ['', [Validators.required]]
    });
  }

  // Ciclo de vida del componente
  async ngOnInit() {
    const { auth, database } = await getFirebase();
    this.auth = auth;
    this.db = database;


    // Escucha cambios en el estado de autenticación
    this.authUnsub = onAuthStateChanged(this.auth, async (user: User | null) => {
      this.isLoggedIn = !!user;
      this.currentUid = user?.uid ?? null;

      if (this.isLoggedIn) {
        await this.ensureDefaultRole();
        this.subUsers();
        this.subMensajes();
      } else {
        this.unsubUsers();
        this.unsubMensajes();
        this.chats = [];
      }
    });
  }

  ngAfterViewInit() {
    // asegura que si ya hay mensajes, se haga scroll
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.authUnsub?.();
    this.unsubUsers();
    this.unsubMensajes();
  }

  // -------- SUBS ----------

  // Subscripción a cambios en usuarios

  // === subUsers(): escucha cambios en la lista de usuarios de Firebase ===
// - Crea una referencia a /users en la base de datos
// - Se suscribe con onValue() y actualiza el mapa de usuarios cada vez que hay un cambio
// - También fuerza una actualización del array de chats (para refrescar nombres o roles en pantalla)
// - Guarda en usersOff() la función para cancelar la suscripción si es necesario

  private subUsers() {
    if (!this.db) return;
    const ref = dbRef(this.db, 'users');
    // snap.val() devuelve el contenido actual de la ruta /users en Firebase
// Si no hay datos (es null), se asigna un objeto vacío para evitar errores

    const cb = (snap: any) => {
      this.usersMap = snap.val() ?? {};
      this.chats = [...this.chats];
    };
    onValue(ref, cb);
    this.usersOff = () => off(ref, 'value', cb);
  }
  private unsubUsers() { this.usersOff?.(); this.usersOff = null; }

  private subMensajes() {
    if (!this.db) return;
    const ref = query(dbRef(this.db, 'rooms/global/messages'), orderByChild('timestamp'));
    const cb = (snap: any) => {
      const list: ChatMsg[] = [];
      snap.forEach((child: any) => {
        const m = child.val();
        list.push({
          id: child.key as string,
          uid: m.uid,
          text: m.text,
          timestamp: typeof m.timestamp === 'number' ? m.timestamp : Date.now()
        });
      });
      this.chats = list;
      this.scrollToBottom(); // auto scroll al recibir mensajes
    };
    onValue(ref, cb);
    this.msgsOff = () => off(ref, 'value', cb);
  }
  private unsubMensajes() { this.msgsOff?.(); this.msgsOff = null; }

  // -------- LOGIN ----------
  async login() {
    if (!this.db || this.loginForm.invalid) return;

  // Indica que el login está en proceso y limpia mensajes previos
    this.loadingLogin = true;
    this.loginErrorMsg = '';
  // Extrae email, password y username del formulario reactivo
    const { email, password, username } = this.loginForm.value;

    // Intenta iniciar sesión con email y password
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      const uid = cred.user.uid;

      // Actualiza el perfil del usuario en la base de datos
      // Si el username es válido (3-24 caracteres), lo guarda como displayName
      // También guarda el alias en localStorage para uso futuro
      // Trim() elimina espacios en blanco al inicio y final del string
      // Finalmente, asegura que el usuario tenga un rol por defecto
      const alias = (username ?? '').toString().trim();
      const payload: any = { email };
      if (alias.length >= 3 && alias.length <= 24) {
        payload.displayName = alias;
        localStorage.setItem('chatAlias', alias);
      }
      await update(dbRef(this.db, `users/${uid}`), payload);

      await this.ensureDefaultRole(uid);
    } catch (e: any) {
      this.loginErrorMsg = e?.message ?? 'Error al iniciar sesión';
    } finally {
      this.loadingLogin = false;
    }
  }

  async logout() {
    await signOut(this.auth);
  }

  // -------- MENSAJES ----------

  // Envía un nuevo mensaje al chat
  async send() {

    // Validaciones básicas: base de datos inicializada, usuario autenticado, formulario válido
    if (!this.db || !this.currentUid || this.form.invalid) return;
    const message: string = (this.form.value.message ?? '').toString().trim();
    if (!message) return;

    // Empuja el nuevo mensaje a Firebase Realtime Database
    // La función push() genera un ID único automáticamente
    // El mensaje incluye UID del autor, texto y timestamp actual
    await push(dbRef(this.db, 'rooms/global/messages'), {
      uid: this.currentUid,
      text: message,
      timestamp: Date.now()
    });

    this.form.patchValue({ message: '' });
    this.scrollToBottom(); // auto scroll al enviar
  }

  // -------- HELPERS ----------
  //HELPER: funciones pequeñas que se usan para simplificar tareas repetitivas o mejorar la legibilidad del código.
  // trackBy para ngFor, mejora rendimiento al renderizar listas
  // Devuelve el ID único del mensaje para que Angular pueda identificarlo
  trackById(_i: number, m: ChatMsg) { return m.id; }
  nombreDe(uid: string) { return this.usersMap[uid]?.displayName || 'Anon'; }
  rolDe(uid: string): 'user' | 'admin' | 'moderator' {
    const r = this.usersMap[uid]?.role;
    return (r === 'admin' || r === 'moderator') ? r : 'user';
  }

  // -------- UTIL: asegurar rol por defecto ----------
  private async ensureDefaultRole(forceUid?: string) {
    if (!this.db) return;
    const uid = forceUid ?? this.currentUid;
    if (!uid) return;

    const roleSnap = await get(dbRef(this.db, `users/${uid}/role`));
    if (!roleSnap.exists()) {
      await update(dbRef(this.db, `users/${uid}`), { role: 'user' });
    }
  }

  // -------- Auto-scroll ----------
  private scrollToBottom() {
    setTimeout(() => {
      if (this.historyRef?.nativeElement) {
        const el = this.historyRef.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}
