/**
 * AIRWARM — enquiry form endpoint
 * =============================================================================
 * Receives the Home Energy Assessment enquiry form and e-mails it to Airwarm.
 *
 * WHAT THIS IS
 * A Google Apps Script web app. It runs inside the Airwarm Google Workspace
 * account, receives the form POST, and sends one e-mail. That is all it does.
 *
 * WHY THIS RATHER THAN A FORM SERVICE
 * The privacy policy at /privacy/ says the form "sends us an e-mail and
 * nothing else. There is no database, no customer relationship system and no
 * third-party dashboard holding a list of enquiries."
 *
 * That sentence is only true if the receiving end keeps no copy. A hosted form
 * service stores every submission in its own dashboard, which would make it a
 * processor under UK GDPR — it would have to be named in the policy, given a
 * data-processing agreement, and included in any deletion request. Running it
 * here keeps the enquiry inside Google Workspace, which the policy ALREADY
 * names as Airwarm's processor. No new vendor, no policy change.
 *
 * THE RULE THIS FILE EXISTS TO PROTECT
 * Do not add storage. No Sheet, no Drive file, no Properties entry, no
 * console.log of the payload. The moment this writes an enquiry anywhere
 * other than the outbound e-mail, the privacy policy becomes false and has to
 * be rewritten before the change ships.
 *
 * DEPLOYMENT
 * See endpoint/README.md in this repository.
 * =============================================================================
 */

/** Where enquiries are sent. Must match the address in the privacy policy. */
var NOTIFY = "hello@airwarm.co.uk";

/**
 * Handles the form POST.
 *
 * The browser sends Content-Type: text/plain on purpose — see the comment in
 * js/assessment.js. That keeps it a "simple" cross-origin request, so the
 * browser does not send an OPTIONS preflight first. Apps Script cannot answer
 * a preflight, so this is what makes the whole thing work.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, error: "empty request" });
    }

    var d = JSON.parse(e.postData.contents);

    /* Server-side validation. The browser checks these too, but a request can
       reach this function without ever going through that page. */
    var required = ["name", "address", "postcode", "email", "telephone"];
    for (var i = 0; i < required.length; i++) {
      if (!d[required[i]] || !String(d[required[i]]).trim()) {
        return json({ ok: false, error: "missing " + required[i] });
      }
    }

    /* Consent is not a formality. Without it there is no lawful basis to hold
       any of this, so the enquiry is refused rather than quietly accepted. */
    if (d.consentGiven !== true) {
      return json({ ok: false, error: "consent not given" });
    }

    MailApp.sendEmail({
      to: NOTIFY,
      replyTo: String(d.email).trim(),
      subject: "Home Energy Assessment enquiry — " + clean(d.name) +
               " — " + clean(d.postcode),
      body: buildBody(d)
    });

    return json({ ok: true });
  } catch (err) {
    /* Deliberately vague to the caller: an error message that echoes back
       what was sent would leak it into somewhere it should not be. The page
       tells the visitor to e-mail or call instead, which is a real fallback. */
    return json({ ok: false, error: "could not process" });
  }
}

/**
 * A GET returns a plain health check, so the deployment can be confirmed in a
 * browser without submitting anything. It reveals nothing.
 */
function doGet() {
  return ContentService
    .createTextOutput("Airwarm enquiry endpoint is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}

/** The e-mail body. Plain text, laid out to be read on a phone. */
function buildBody(d) {
  var L = [];
  L.push("A Home Energy Assessment enquiry has come in from airwarm.co.uk.");
  L.push("");
  L.push("CONTACT");
  L.push("  Name:      " + clean(d.name));
  L.push("  Address:   " + clean(d.address));
  L.push("  Postcode:  " + clean(d.postcode));
  L.push("  E-mail:    " + clean(d.email));
  L.push("  Telephone: " + clean(d.telephone));
  L.push("");
  L.push("CONSENT");
  L.push("  Given at:  " + clean(d.consentAt));
  L.push("  For:       holding these details and looking up the public EPC");
  L.push("             record for this address, in order to reply.");
  L.push("");
  L.push("ASSESSMENT RESULT SHOWN TO THEM");
  L.push("  Outcome:   " + clean(d.assessmentOutcome));
  L.push("  Score:     " + clean(d.assessmentScore));
  L.push("");
  L.push("  Note: the scoring behind this is still the unapproved placeholder");
  L.push("  logic. Treat the outcome as a conversation starter, not a finding.");
  L.push("");
  L.push("THEIR ANSWERS");

  var answers = d.answers || {};
  Object.keys(answers).forEach(function (k) {
    L.push("  " + pad(k) + clean(answers[k]));
  });

  L.push("");
  L.push("NEXT STEP");
  L.push("  Look up the EPC for the address, read it against the answers,");
  L.push("  then reply. Nothing has been sent to them beyond an on-screen");
  L.push("  acknowledgement — they are expecting a person, not an autoreply.");
  L.push("");
  L.push("Retention: 12 months from last contact if this does not lead to");
  L.push("work, per the privacy policy.");

  return L.join("\n");
}

/** Right-pads a field name so the answers line up in a monospaced client. */
function pad(s) {
  var out = String(s) + ":";
  while (out.length < 26) { out += " "; }
  return out;
}

/**
 * Strips anything that could turn a value into something other than text.
 * The values arrive from a public form, so they are untrusted input even
 * though they only ever land in a plain-text e-mail.
 */
function clean(v) {
  if (v === undefined || v === null) { return "(not given)"; }
  return String(v).replace(/[\r\n]+/g, " ").trim().slice(0, 500);
}

/** JSON response helper. */
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
