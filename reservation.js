// Shared by the quick reservation and cart forms. Web3Forms keys are public
// form identifiers; delivery to the intended inbox must be verified separately.
(() => {
    const form = document.getElementById('reservationForm');
    if (!form) return;

    const status = document.getElementById('reservationStatus');
    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button.innerHTML;
    let sending = false;

    function showStatus(message, failed = false) {
        status.textContent = message;
        status.style.color = failed ? '#a32020' : '#1e4d2b';
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (sending || !form.reportValidity()) return;

        const payload = Object.fromEntries(new FormData(form));
        // AJAX stays on this page so customers can see errors and retry.
        delete payload.redirect;
        sending = true;
        button.disabled = true;
        button.textContent = 'Sending…';
        form.setAttribute('aria-busy', 'true');
        showStatus('Sending your reservation request…');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            const result = await response.json();
            if (!response.ok || result.success !== true) {
                const detail = typeof result.message === 'string' ? result.message : 'The form service rejected the request.';
                showStatus(`Your request was not accepted: ${detail} Your details are still here. Please try again or call (352) 804-5785.`, true);
                return;
            }

            form.reset();
            showStatus('Thank you! Your reservation request was received. We will contact you to confirm availability and installation.');
        } catch (error) {
            showStatus('We could not confirm that your request was received. Your details are still here. Please call (352) 804-5785, or try again if you have not already received confirmation.', true);
        } finally {
            clearTimeout(timeout);
            sending = false;
            button.disabled = false;
            button.innerHTML = originalLabel;
            form.removeAttribute('aria-busy');
            status.focus();
        }
    });
})();
