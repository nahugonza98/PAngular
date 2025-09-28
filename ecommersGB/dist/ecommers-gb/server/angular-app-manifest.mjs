
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "node_modules/firebase/database/dist/esm/index.esm.js": [
    {
      "path": "chunk-IGWJEAVX.js",
      "dynamicImport": false
    }
  ],
  "node_modules/firebase/auth/dist/esm/index.esm.js": [
    {
      "path": "chunk-V7WAKQ5L.js",
      "dynamicImport": false
    }
  ],
  "node_modules/firebase/app/dist/esm/index.esm.js": [
    {
      "path": "chunk-SYA447H3.js",
      "dynamicImport": false
    }
  ]
},
  assets: {
    'index.csr.html': {size: 23821, hash: 'f0db9e5bdb410dacb16d3929773012df8a2f07829ea2213e23ec3cc0ba10ab36', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17291, hash: '2697c3600534d7cf6cfac6f0bfcefd6a4d1696d38131085c2ea083acf43f6874', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-6H6RLDCN.css': {size: 7083, hash: 'cmHBi6m2rfg', text: () => import('./assets-chunks/styles-6H6RLDCN_css.mjs').then(m => m.default)}
  },
};
