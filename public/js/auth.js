/**
 * Simplifiedaction – Auth côté client (token JWT en localStorage)
 * À charger sur toutes les pages pour mettre à jour le header (connecté / invité).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'simplifiedaction_token';

  function getToken() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function setToken(token) {
    try {
      localStorage.setItem(STORAGE_KEY, token);
      return true;
    } catch {
      return false;
    }
  }

  function removeToken() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  function updateNav() {
    const guest = document.getElementById('nav-guest');
    const user = document.getElementById('nav-user');
    const loggedIn = !!getToken();
    if (guest) guest.hidden = loggedIn;
    if (user) user.hidden = !loggedIn;
  }

  function initLogout() {
    document.getElementById('btn-logout')?.addEventListener('click', function () {
      removeToken();
      window.location.href = 'index.html';
    });
  }

  function initAuth() {
    updateNav();
    initLogout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

  window.simplifiedAuth = {
    getToken,
    setToken,
    removeToken,
    updateNav
  };
})();
