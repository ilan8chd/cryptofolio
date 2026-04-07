<script setup></script>

<template>
  <div id="layout">
    <nav class="navbar">
      <RouterLink to="/" class="logo">
        <span class="logo-icon">C</span>
        <span>CryptoFolio</span>
      </RouterLink>
      <div class="nav-links">
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/portfolio">Portefeuille</RouterLink>
        <RouterLink to="/market">March&eacute;s</RouterLink>
        <RouterLink to="/add" class="nav-btn">+ Ajouter</RouterLink>
      </div>
    </nav>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  background: #0b0e14;
  color: #c8ccda;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

#layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 56px;
  background: #0f1219;
  border-bottom: 1px solid #1a1f2e;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #e0e4f0;
  text-decoration: none;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #25d695, #1a9e6d);
  color: #000;
  font-weight: 700;
  font-size: 0.85rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-links a {
  color: #5a6070;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.85rem;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  transition: all 0.15s;
}

.nav-links a:hover {
  color: #c8ccda;
  background: #151a28;
}

.nav-links a.router-link-exact-active {
  color: #e0e4f0;
  background: #151a28;
}

.nav-btn {
  background: #25d695 !important;
  color: #000 !important;
  font-weight: 600 !important;
  margin-left: 0.5rem;
}

.nav-btn:hover {
  background: #1fc084 !important;
}

main {
  flex: 1;
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #1e2433;
  border-radius: 3px;
}
</style>
