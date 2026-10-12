# Reservation email delivery

The required recipient is synergysoftwash@gmail.com.

Both reservation forms use Web3Forms. The `access_key` hidden field determines
which inbox receives submissions; adding a recipient address as a normal form
field does not change routing.

Delivery has not yet been verified for the existing key.

To finish setup:
1. Sign in to https://app.web3forms.com using synergysoftwash@gmail.com.
2. Open the website's form and confirm its recipient, or create a form for that inbox.
3. Copy its public form access key into the `access_key` field in both `index.html`
   and `cart.html`. Do not share a password or private account API token.
4. Test both forms in a browser with clearly marked test reservations, and confirm
   the corresponding messages arrive in synergysoftwash@gmail.com, including
   tree preferences or cart contents, phone, and installation address.
5. Merge and verify the production deployment only after delivery is confirmed.

The direct email links provide an alternative contact method while email routing
is being verified. Automated response handling checks can be run with:

    node --test tests/reservation.test.cjs
