/* Pomiar: strona tylko wypycha zdarzenia do dataLayer.
   GTM decyduje (zależnie od zgód), czy i dokąd je wysłać.
   Do dataLayer NIGDY nie trafia imię, e-mail ani inna treść formularza. */
window.dataLayer = window.dataLayer || [];
function track(event, params) {
  window.dataLayer.push(Object.assign({ event: event }, params || {}));
}

/* 1. Kliknięcia CTA – każde CTA ma data-cta-id (naglowek, hero, oferta, faq) */
document.querySelectorAll('[data-cta-id]').forEach(function (el) {
  el.addEventListener('click', function () {
    track('cta_click', {
      cta_id: el.dataset.ctaId,
      cta_text: el.textContent.trim(),
      cta_target: 'zapis'
    });
  });
});

/* 2. Widoczność sekcji oferty – raz na odsłonę, przy 50% widoczności */
var offer = document.querySelector('[data-section-id]');
if (offer && 'IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        track('section_view', { section_id: entry.target.dataset.sectionId });
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  io.observe(offer);
}

/* 3. Formularz: walidacja, form_start, generate_lead */
var form = document.getElementById('lead-form');
var success = document.getElementById('lead-success');
var FORM_ID = 'zapis_kurs_pjm';
var started = false;

form.addEventListener('input', startOnce);
form.addEventListener('change', startOnce);
function startOnce() {
  if (started) return;
  started = true;
  track('form_start', { form_id: FORM_ID });
}

function setError(input, errId, msg) {
  var err = document.getElementById(errId);
  err.textContent = msg || '';
  if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  return !msg;
}

function validate() {
  var name = form.elements.name;
  var email = form.elements.email;
  var format = form.elements.format;
  var consent = form.elements.consent;
  var level = form.querySelector('input[name="level"]:checked');
  var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());

  var results = [
    [name, setError(name, 'f-name-err', name.value.trim().length < 2 ? 'Wpisz imię (co najmniej 2 znaki).' : '')],
    [email, setError(email, 'f-email-err',
      !email.value.trim() ? 'Wpisz adres e-mail.' :
      !emailOk ? 'Wpisz adres w formacie nazwa@domena.pl.' : '')],
    [form.querySelector('input[name="level"]'), setError(null, 'f-level-err', level ? '' : 'Wybierz swój poziom.')],
    [format, setError(format, 'f-format-err', format.value ? '' : 'Wybierz formę zajęć.')],
    [consent, setError(consent, 'f-consent-err', consent.checked ? '' : 'Zaznacz zgodę, żebyśmy mogli odpowiedzieć.')]
  ];
  var firstBad = results.find(function (r) { return !r[1]; });
  if (firstBad) firstBad[0].focus();
  return !firstBad;
}

form.addEventListener('submit', function (e) {
  e.preventDefault(); // brak wysyłki i brak danych w adresie URL
  if (!validate()) return;

  // Tylko parametry nieosobowe
  track('generate_lead', {
    form_id: FORM_ID,
    course_format: form.elements.format.value,
    course_level: form.querySelector('input[name="level"]:checked').value
  });

  form.reset();
  form.hidden = true;
  success.hidden = false;
  success.focus();
});

/* 4. Zmiana zgód – działa po instalacji Cookiebot (spotkanie 3) */
document.getElementById('consent-settings').addEventListener('click', function () {
  if (window.Cookiebot && typeof window.Cookiebot.renew === 'function') {
    window.Cookiebot.renew();
  } else {
    alert('Baner zgód nie jest jeszcze podłączony (CMP dodajemy na spotkaniu 3).');
  }
});
