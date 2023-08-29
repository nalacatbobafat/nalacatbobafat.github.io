'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"version.json": "4ab9de009478a54238f966c3bcf107aa",
"index.html": "9a545227148bb0269e8e54c39ea55d95",
"/": "9a545227148bb0269e8e54c39ea55d95",
"main.dart.js": "efc2e72f42b4e118ec2503a25062885f",
"flutter.js": "0b19a3d1d54c58174c41cd35acdd9388",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "541f9dc8632de26e9cedf100c417522c",
"assets/dotenv": "9c6ee7f56600b3069b2417ade2d88b24",
"assets/AssetManifest.json": "de97fd6ab7beaf454ce6d13371840dbd",
"assets/NOTICES": "95706a67df2ea0990f56a78f86407334",
"assets/FontManifest.json": "30fe48fe0bff80eb3b180cd7b4405197",
"assets/packages/flutter_image_compress_web/assets/pica.min.js": "6208ed6419908c4b04382adc8a3053a2",
"assets/shaders/ink_sparkle.frag": "f8b80e740d33eb157090be4e995febdf",
"assets/AssetManifest.bin": "38e48b9324694c5f620f9ff3d4fc1ef5",
"assets/fonts/MaterialIcons-Regular.otf": "608f318bb68771518e4dfd825af4b12f",
"assets/assets/images/landing-page-main.svg": "806edc18e48bb1fc2022125b7e9d5d9c",
"assets/assets/images/landing-page-journey.svg": "0672730724a8564b240cda135bf9f849",
"assets/assets/images/oral-map.svg": "d2ecc3f6c9076d75060090b972aaeea4",
"assets/assets/images/landing-page-ease.svg": "3c2d3a89531fbeb0b3103e1c10ba9d09",
"assets/assets/images/synapse-vector.svg": "d0b63d1e026dc26e4b76ec5e300de6ef",
"assets/assets/images/contact-us-main.svg": "7091f537414d492ad622e8d5b5cadd2a",
"assets/assets/images/about-us-main.svg": "b9c23b3461c9aa4f27128a6aee264aa3",
"assets/assets/images/synapse-logo-nocolor.svg": "20c1ebdcda09aa34ea0f9da7995b441d",
"assets/assets/images/synapse-logo-color.svg": "df2c5ba0189dee11b6d3fbc4b6cc6fb4",
"assets/assets/images/landing-page-network.svg": "2e858ca65c370eb6ce604e19325002dd",
"assets/assets/fonts/Urbanist-VariableFont_wght.ttf": "22473ef640a35b4fac0dae06e24dde92",
"assets/assets/fonts/CormorantInfant-SemiBold.ttf": "d16c109eaed5ab09ee2544b23a697692",
"canvaskit/skwasm.js": "95f16c6690f955a45b2317496983dbe9",
"canvaskit/skwasm.wasm": "5d6b65e449fe423bb98a274371447470",
"canvaskit/chromium/canvaskit.js": "d8d4917d0a0448b0fa33c79ad15f1452",
"canvaskit/chromium/canvaskit.wasm": "35740b44fde84f48839d95b4dba9695e",
"canvaskit/canvaskit.js": "2e65915dd6fc92a572724caf478a3779",
"canvaskit/canvaskit.wasm": "72be88a325c528688dd17f348494cee3",
"canvaskit/skwasm.worker.js": "51253d3321b11ddb8d73fa8aa87d3b15"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
