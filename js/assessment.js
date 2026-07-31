/* ==========================================================================
   AIRWARM — assessment.js
   Runs the Home Energy Assessment on /home-energy-assessment/.

   TWO THINGS TO UNDERSTAND BEFORE EDITING THIS FILE
   -------------------------------------------------
   1. NOTHING LEAVES THE BROWSER UNTIL THE VISITOR DECIDES IT SHOULD. The four
      stages, the scoring and the result are all computed on the visitor's own
      device. No cookie, no local storage, nothing written to disk.

      There is exactly ONE network request in this file, and it only happens
      when someone fills in the enquiry form after their result and ticks the
      consent box. Everything about that is at the WIRE-UP POINT near the
      bottom of this file. If you are adding a second place that transmits,
      stop: put it there instead, or the privacy policy stops being true.

      The form does not appear at all unless ENQUIRY_ENDPOINT below is set.
      That is the safety catch — an unconfigured deployment cannot collect
      anything, it just offers the e-mail and telephone route as before.

   2. THE SCORING BELOW IS NOT APPROVED. The Airwarm pack specifies the three
      outcomes and their wording, but it does not say which answers lead to
      which outcome. Rather than hide an invented rule inside the code, every
      threshold is a named value in the one config object below, and every
      one of them is listed as a question in TRIAGE_RULES_FOR_REVIEW.md in the
      root of this repository.
   ========================================================================== */

/* ==========================================================================
   ENQUIRY ENDPOINT — the one piece of configuration in this file.

   Set this to the URL that receives the enquiry form. Leave it as an empty
   string and the form is not rendered at all: visitors get the e-mail and
   telephone invitation instead, and the site collects nothing. That is the
   default on purpose, so no deployment can start collecting by accident.

   BEFORE SETTING IT, all of the following must already be true:
     - the privacy policy at /privacy/ describes this form   (done)
     - it names the data controller                          (done — AIRWARM LTD)
     - it states the lawful basis and the retention period   (done — consent, 12 months)
     - the consent checkbox is unticked by default           (done — see buildEnquiryForm)
     - the endpoint forwards to hello@airwarm.co.uk and keeps no copy

   The endpoint is the Google Apps Script web app in /endpoint/. It sends one
   e-mail and stores nothing, which is what keeps the privacy policy's "no
   database, no third-party dashboard" sentence true. Setup instructions are
   in endpoint/README.md.

   If you ever point this somewhere that DOES keep a copy of submissions,
   that service is a processor under UK GDPR and must be named in the privacy
   policy BEFORE the URL changes here.
   ========================================================================== */
var ENQUIRY_ENDPOINT = "";

/* ==========================================================================
   UNAPPROVED PLACEHOLDER LOGIC — requires Thomas Robinson's sign-off before
   this form goes live.
   ==========================================================================
   Every number and list in AIRWARM_TRIAGE_CONFIG below was chosen by the
   website builder as a starting point for discussion. None of it comes from
   the Airwarm documentation, and none of it has been reviewed by anyone
   technically qualified.

   Each entry is written out in plain English as a question in
   TRIAGE_RULES_FOR_REVIEW.md. Answer those questions, change the numbers
   here to match, and delete this comment block only when Thomas Robinson has
   confirmed the logic is correct.

   Until then the page tells the visitor, in the outcome text, that the result
   is indicative and that a person will make the real judgement.
   ========================================================================== */
var AIRWARM_TRIAGE_CONFIG = {

  /* ---- Step 1: how many points each answer is worth -------------------
     Higher points mean the answer points towards a heat pump working well.
     Negative points mean it points away. Zero means neutral, and is also
     used for every "Not sure" answer so that honesty is never penalised. */
  answerPoints: {

    /* Stage 1 — property */
    propertyType: {
      detached: 2,
      semiDetached: 2,
      endTerrace: 1,
      midTerrace: 1,
      backToBack: 0,
      bungalow: 2,
      flat: 0
    },
    propertyAge: {
      pre1919: 0,
      interwar1919to1944: 1,
      postwar1945to1975: 1,
      modern1976to2002: 2,
      newest2003onwards: 3,
      notSure: 0
    },
    currentHeating: {
      mainsGasBoiler: 1,
      oilBoiler: 2,
      lpgBoiler: 2,
      electricStorageHeaters: 2,
      directElectric: 2,
      solidFuel: 1,
      existingHeatPump: 1,
      noHeating: 1
    },

    /* Stage 2 — condition */
    insulationConfidence: {
      goodThroughout: 3,
      partial: 1,
      limited: -1,
      notSure: 0
    },
    windows: {
      doubleOrTripleThroughout: 2,
      mixed: 1,
      mostlySingle: -1,
      notSure: 0
    },
    radiators: {
      modernAndGenerous: 2,
      standard: 1,
      smallOrOld: 0,
      noneOrUnderfloor: 1,
      notSure: 0
    },
    outdoorSpace: {
      yesClearSpace: 3,
      possiblyTight: 1,
      noObviousLocation: 0,   /* handled as a constraint below, not by points */
      notSure: 0
    },
    hotWaterSpace: {
      existingCylinder: 3,
      spaceAvailable: 2,
      noSpaceIdentified: 0,   /* handled as a constraint below, not by points */
      notSure: 0
    },

    /* Stage 3 — plans */
    renovationPlans: {
      majorRenovation: 2,
      someWork: 1,
      noWorkPlanned: 0
    },
    timescale: {
      withinSixMonths: 1,
      sixToTwelveMonths: 1,
      overTwelveMonths: 0,
      justResearching: 0
    },
    emitterWillingness: {
      yesIfNeeded: 3,
      maybeWithExplanation: 1,
      notWilling: 0          /* handled as a constraint below, not by points */
    }
  },

  /* ---- Step 2: the two score thresholds -------------------------------
     A total at or above likelySuitableMinimumScore gives "Likely suitable".
     A total at or above potentiallySuitableMinimumScore gives "Potentially
     suitable". Anything below that gives "Not currently suitable".
     For reference, the maximum achievable total is about 26. */
  outcomeThresholds: {
    likelySuitableMinimumScore: 17,
    potentiallySuitableMinimumScore: 10
  },

  /* ---- Step 3: answers that stop a "Likely suitable" outcome ----------
     These are the practical obstacles listed in the Airwarm operating
     manual as common reasons a property is not currently a good candidate.
     Each one caps the result at "Potentially suitable" or lower, whatever
     the score, and each one produces a named explanation for the visitor so
     they always know WHY. Nothing here produces a blunt rejection. */
  constraintsThatCapTheOutcome: [
    {
      id: "noOutdoorLocation",
      field: "outdoorSpace",
      value: "noObviousLocation",
      capAt: "notCurrently",
      explanation: "There is no obvious outdoor position for the unit. This is " +
        "usually the first thing to solve, and it is often solvable once " +
        "someone has looked at the property properly."
    },
    {
      id: "noHotWaterSpace",
      field: "hotWaterSpace",
      value: "noSpaceIdentified",
      capAt: "potentially",
      explanation: "No location for a hot-water cylinder has been identified " +
        "yet. A cylinder is needed, so finding a sensible position is one of " +
        "the main practical questions for your home."
    },
    {
      id: "emittersNotNegotiable",
      field: "emitterWillingness",
      value: "notWilling",
      capAt: "notCurrently",
      explanation: "Keeping the existing radiators exactly as they are is a " +
        "real constraint, because a heat pump runs at a lower temperature " +
        "than a boiler and some rooms usually need a larger emitter to stay " +
        "comfortable."
    },
    {
      id: "poorFabricNoPlan",
      field: "insulationConfidence",
      value: "limited",
      requiresAlso: { field: "renovationPlans", value: "noWorkPlanned" },
      capAt: "potentially",
      explanation: "Limited insulation with no improvement work planned means " +
        "the home would lose heat faster than the system could comfortably " +
        "replace it. Fabric improvements first usually make a much bigger " +
        "difference than the choice of heat pump."
    },
    {
      id: "restrictedProperty",
      field: "propertyRestrictions",
      value: "yes",
      capAt: "potentially",
      explanation: "Listed-building, conservation-area or leasehold " +
        "restrictions do not rule a heat pump out, but they change what is " +
        "permitted and where the unit can go, so they need checking early."
    }
  ],

  /* ---- Step 4: how far outside West Yorkshire we still respond --------
     Only the outward part of the postcode is asked for, and it is never
     sent anywhere. These are the outward-code prefixes Airwarm is starting
     with. An unrecognised prefix does NOT change the outcome; it only adds a
     note about service area. */
  serviceAreaOutwardPrefixes: ["BD", "LS", "HD", "HX", "WF"],

  /* ---- Step 5: wording of the outcome labels --------------------------
     These three labels are fixed by the Airwarm pack. Do not reword them. */
  outcomeLabels: {
    likely: "Likely suitable",
    potentially: "Potentially suitable",
    notCurrently: "Not currently suitable"
  }
};
/* ===================== END OF UNAPPROVED PLACEHOLDER LOGIC ============== */


/* ==========================================================================
   Everything below this line is plumbing: showing one stage at a time,
   checking that questions have been answered, adding up the points and
   revealing the result. It contains no policy decisions.
   ========================================================================== */
(function () {
  "use strict";

  var form = document.getElementById("aw-assessment");
  if (!form) { return; }

  var stages = Array.prototype.slice.call(form.querySelectorAll(".aw-stage"));
  var totalStages = stages.length;
  var current = 0;

  var progressFill = document.getElementById("aw-progress-fill");
  var progressLabel = document.getElementById("aw-progress-label");
  var errorBox = document.getElementById("aw-form-error");
  var resultBox = document.getElementById("aw-result");

  /* The id of the validation paragraph, used to point an unanswered field's
     aria-describedby at the message about it. */
  var ERROR_ID = "aw-form-error";

  /* The answers and the result from the last time the result was rendered.
     Held only in memory, only for this page view, and only so the enquiry
     form can send them if the visitor chooses to. Never written to storage;
     closing the tab discards them. */
  var lastAnswers = null;
  var lastResult = null;

  /* ---- Marking a field as unanswered, for assistive technology ---------
     The visible message at the top of the form names the questions. These two
     helpers make the same information reachable from the field itself, which
     is what a screen-reader user gets when they tab back into it. Nothing here
     stores or sends anything. */
  function markInvalid(fields) {
    Array.prototype.forEach.call(fields, function (field) {
      field.setAttribute("aria-invalid", "true");
      var ids = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
      if (ids.indexOf(ERROR_ID) === -1) { ids.push(ERROR_ID); }
      field.setAttribute("aria-describedby", ids.join(" "));
    });
  }

  function clearInvalid(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[aria-invalid="true"]'), function (field) {
      field.removeAttribute("aria-invalid");
      var ids = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(function (id) {
        return id && id !== ERROR_ID;
      });
      if (ids.length) {
        field.setAttribute("aria-describedby", ids.join(" "));
      } else {
        field.removeAttribute("aria-describedby");
      }
    });
  }

  /* ---- Showing one stage at a time ---------------------------------- */
  function showStage(index) {
    stages.forEach(function (stage, i) {
      stage.classList.toggle("is-active", i === index);
    });
    current = index;
    updateProgress();
    errorBox.textContent = "";
    clearInvalid(form);

    /* Move focus to the new stage heading so keyboard and screen-reader
       users are not left behind at the bottom of the page. */
    var heading = stages[index].querySelector("h2, h3");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }

  function updateProgress() {
    var pct = Math.round(((current + 1) / totalStages) * 100);
    progressFill.style.width = pct + "%";
    progressLabel.textContent = "Stage " + (current + 1) + " of " + totalStages;
  }

  /* ---- Checking the current stage is complete ------------------------
     Uses the browser's own required/validity rules so the markup stays the
     single source of truth. */
  function stageIsComplete(stage) {
    var missing = [];
    var groupsSeen = {};

    clearInvalid(stage);

    Array.prototype.forEach.call(stage.querySelectorAll("[required]"), function (field) {
      if (field.type === "radio") {
        if (groupsSeen[field.name]) { return; }
        groupsSeen[field.name] = true;
        var checked = stage.querySelector('input[name="' + field.name + '"]:checked');
        if (!checked) {
          missing.push(labelFor(field));
          markInvalid(stage.querySelectorAll('input[name="' + field.name + '"]'));
        }
      } else if (!field.value) {
        missing.push(labelFor(field));
        markInvalid([field]);
      }
    });

    return missing;
  }

  /* The name a validation message uses for a field. The field's own <label>
     comes first, so that a question inside a stage-level fieldset is named by
     its question rather than by the stage. Radio groups have no label[for], so
     they fall through to their own fieldset's <legend>, which is what names
     them. */
  function labelFor(field) {
    var lbl = field.id ? document.querySelector('label[for="' + field.id + '"]') : null;
    if (lbl) { return lbl.textContent.trim(); }
    var fs = field.closest("fieldset");
    if (fs && fs.querySelector("legend")) {
      return fs.querySelector("legend").textContent.trim();
    }
    return "a question above";
  }

  /* ---- Reading the answers ------------------------------------------ */
  function readAnswers() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name) { return; }
      if (field.type === "radio") {
        if (field.checked) { data[field.name] = field.value; }
      } else if (field.type === "checkbox") {
        data[field.name] = field.checked ? field.value : "";
      } else {
        data[field.name] = field.value;
      }
    });
    return data;
  }

  /* ---- Reading the answers as readable text --------------------------
     readAnswers() above returns machine values — "semiDetached", "pre1919" —
     which the scoring needs and a person reading an e-mail does not.

     This returns the same answers as the question and answer a human would
     recognise, in the order they were asked, so the enquiry e-mail can be
     read straight off a phone without anyone decoding it.

     It reads the wording out of the page rather than keeping a second copy
     of it here. Reword a question in the HTML and the e-mail follows; there
     is no list to keep in step. */
  function readTranscript() {
    var out = [];
    var groupsSeen = {};

    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name) { return; }

      if (field.type === "radio") {
        /* One entry per group, not per option. */
        if (groupsSeen[field.name]) { return; }
        groupsSeen[field.name] = true;

        var fs = field.closest("fieldset");
        var legend = fs && fs.querySelector("legend");
        var checked = form.querySelector(
          'input[name="' + field.name + '"]:checked');

        out.push({
          question: legend ? legend.textContent.trim() : field.name,
          /* The radio sits inside its own <label>, so the label's text minus
             nothing else is the answer as the visitor read it. */
          answer: checked && checked.parentNode
            ? checked.parentNode.textContent.trim()
            : "(not answered)"
        });
        return;
      }

      if (field.tagName === "SELECT") {
        var opt = field.options[field.selectedIndex];
        out.push({
          question: labelFor(field),
          answer: opt && opt.value ? opt.text.trim() : "(not answered)"
        });
        return;
      }

      if (field.type === "text" || field.type === "email" || field.type === "tel") {
        out.push({
          question: labelFor(field),
          answer: field.value.trim() || "(not answered)"
        });
      }
    });

    return out;
  }

  /* ---- The reference shown to the customer and quoted in the e-mail ---
     Six characters, generated in the browser at submission time. It is a
     label for a conversation, not a secret and not a key: it identifies
     nothing on its own and nothing is stored against it. Its whole job is
     to let someone say "I sent one yesterday, reference AW-4K2P9C" and be
     found in an inbox. */
  function makeReference() {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; /* no I, O, 0, 1 */
    var out = "";
    for (var i = 0; i < 6; i++) {
      out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return "AW-" + out;
  }

  /* ---- Applying the placeholder logic -------------------------------- */
  function assess(answers) {
    var cfg = AIRWARM_TRIAGE_CONFIG;
    var score = 0;

    Object.keys(cfg.answerPoints).forEach(function (field) {
      var given = answers[field];
      var table = cfg.answerPoints[field];
      if (given && Object.prototype.hasOwnProperty.call(table, given)) {
        score += table[given];
      }
    });

    /* Rank the three outcomes so a cap can only ever move the result down. */
    var order = ["notCurrently", "potentially", "likely"];
    var outcome = "notCurrently";
    if (score >= cfg.outcomeThresholds.likelySuitableMinimumScore) {
      outcome = "likely";
    } else if (score >= cfg.outcomeThresholds.potentiallySuitableMinimumScore) {
      outcome = "potentially";
    }

    var reasons = [];
    cfg.constraintsThatCapTheOutcome.forEach(function (rule) {
      if (answers[rule.field] !== rule.value) { return; }
      if (rule.requiresAlso && answers[rule.requiresAlso.field] !== rule.requiresAlso.value) {
        return;
      }
      reasons.push(rule.explanation);
      if (order.indexOf(rule.capAt) < order.indexOf(outcome)) {
        outcome = rule.capAt;
      }
    });

    /* Service-area note only. This never changes the outcome. */
    var outward = (answers.postcodeArea || "").trim().toUpperCase();
    var prefix = outward.replace(/[^A-Z]/g, "").slice(0, 2);
    var inServiceArea = cfg.serviceAreaOutwardPrefixes.indexOf(prefix) !== -1;

    /* How many questions were answered "not sure". This does NOT affect the
       outcome. It is only used to explain the result honestly: someone who
       does not know much about their own house should be told that the answer
       reflects missing information rather than a fault with their property. */
    var notSureCount = 0;
    Object.keys(answers).forEach(function (field) {
      if (answers[field] === "notSure") { notSureCount += 1; }
    });

    return {
      outcome: outcome,
      score: score,
      reasons: reasons,
      notSureCount: notSureCount,
      inServiceArea: inServiceArea || outward === ""
    };
  }

  /* ---- The outcome copy ---------------------------------------------
     This wording comes from website/06_Home_Energy_Assessment/Result_Copy.md
     and is approved. The "not currently suitable" version deliberately is
     not a rejection screen: it explains the constraint and gives a route
     forward. Do not turn it into one. */
  var OUTCOME_COPY = {
    likely: {
      className: "aw-outcome--likely",
      heading: "Your home shows several positive indicators",
      body: "Your answers show several positive indicators. A short review " +
        "call is worthwhile so Airwarm can confirm the main details and " +
        "decide whether a full survey is the right next step.",
      next: "Send us an e-mail and mention that you have completed the " +
        "assessment. We will arrange a short call to go through the details."
    },
    potentially: {
      className: "aw-outcome--potentially",
      heading: "Your home may well be suitable, with a few things to check",
      body: "Your property may be suitable, but one or two details need " +
        "clarification. This is common. Airwarm will explain what matters " +
        "and what may need improving before a survey.",
      next: "Send us an e-mail describing your property. We will tell you " +
        "which details would need checking and what order to tackle them in."
    },
    notCurrently: {
      className: "aw-outcome--not-currently",
      heading: "A heat pump may not be the best next step for your home today",
      body: "A heat pump may not be the best next step today based on the " +
        "information provided. This is not necessarily a permanent " +
        "rejection. Airwarm will explain the main constraints and suggest " +
        "practical improvements or alternatives.",
      next: "This is worth a conversation rather than a dead end. E-mail us " +
        "with a short description of your property and we will tell you " +
        "honestly what would need to change, and whether it is worth doing."
    }
  };

  /* ==================================================================
     THE ENQUIRY FORM
     The only part of this site that collects personal data. Read the
     ENQUIRY_ENDPOINT comment at the top of this file before changing
     anything here.

     Accessibility is not optional in this block. The requirements are
     WCAG 2.2 AA obligations, and they are also written down in the
     comment on /contact/:
       - a real <label for="..."> on every field, never a placeholder
       - the group in a <fieldset> with a <legend>
       - autocomplete on name, email and tel so browsers can fill them
       - validation messages that name the field and are tied to it with
         aria-describedby and aria-invalid
       - no meaning carried by colour alone
     ================================================================== */

  var ENQUIRY_ERROR_ID = "aw-enquiry-error";

  /* Every field: id, label, input type, autocomplete token, and whether it
     is required. Kept as data so the markup, the validation and the payload
     cannot drift apart — add a field here and all three follow. */
  var ENQUIRY_FIELDS = [
    { id: "enqName", label: "Your name", type: "text",
      autocomplete: "name", required: true },
    { id: "enqAddress", label: "Property address", type: "text",
      autocomplete: "street-address", required: true,
      hint: "The property the assessment was about, if it is not where you live." },
    { id: "enqPostcode", label: "Postcode", type: "text",
      autocomplete: "postal-code", required: true },
    { id: "enqEmail", label: "E-mail address", type: "email",
      autocomplete: "email", required: true },
    { id: "enqPhone", label: "Telephone number", type: "tel",
      autocomplete: "tel", required: true,
      hint: "So we can talk it through if that is quicker than writing." }
  ];

  function buildEnquiryForm() {
    var html = "";

    html += '<div class="aw-enquiry">';
    html += '<h4 id="aw-enquiry-heading">Would you like Airwarm to carry out a ' +
      "more detailed desktop review before arranging a survey?</h4>";
    html += "<p>If you send us your details, a person will check the public " +
      "energy performance record for your address, read it alongside your " +
      "answers, and come back to you. It is not automatic and it is not a " +
      "sales sequence &mdash; it is one considered reply.</p>";

    html += '<form id="aw-enquiry-form" novalidate aria-labelledby="aw-enquiry-heading">';

    /* The validation summary. Empty until something is wrong; aria-live so a
       screen reader announces it without moving focus unexpectedly. */
    html += '<p class="aw-form__error" id="' + ENQUIRY_ERROR_ID +
      '" role="status" aria-live="polite"></p>';

    html += '<fieldset class="aw-fieldset"><legend>Your details</legend>';

    ENQUIRY_FIELDS.forEach(function (field) {
      var describedBy = field.hint ? field.id + "-hint" : "";
      html += '<div class="aw-field">';
      html += '<label for="' + field.id + '">' + field.label + "</label>";
      if (field.hint) {
        html += '<span class="aw-field__hint" id="' + field.id + '-hint">' +
          field.hint + "</span>";
      }
      html += '<input type="' + field.type + '" id="' + field.id +
        '" name="' + field.id + '"' +
        ' autocomplete="' + field.autocomplete + '"' +
        (describedBy ? ' aria-describedby="' + describedBy + '"' : "") +
        (field.required ? " required" : "") + ">";
      html += "</div>";
    });

    html += "</fieldset>";

    /* Preferred contact method. Optional by design: making it required would
       force a choice on someone who genuinely does not mind, and the honest
       default is that either is fine. */
    html += '<div class="aw-field">';
    html += '<label for="enqPreferred">Preferred way to be contacted</label>';
    html += '<span class="aw-field__hint" id="enqPreferred-hint">Optional. ' +
      "We will use whichever you pick; leave it as it is if you do not " +
      "mind.</span>";
    html += '<select id="enqPreferred" name="enqPreferred" aria-describedby="enqPreferred-hint">';
    html += '<option value="noPreference">No preference</option>';
    html += '<option value="email">E-mail</option>';
    html += '<option value="telephone">Telephone</option>';
    html += "</select>";
    html += "</div>";

    /* ---- Spam protection ------------------------------------------------
       A honeypot: a field a person never sees and never fills, which bots
       fill because they complete every input they find. Hidden from
       assistive technology too, so a screen-reader user is not asked to
       complete a field that must stay empty.

       Deliberately NOT a third-party CAPTCHA. Those load code from another
       company, profile the visitor, and would make the cookie policy and
       the "no third-party requests" claim false. This costs nothing and
       stops the overwhelming majority of automated submissions. If real
       spam gets through, add a server-side rate limit at the endpoint
       before reaching for anything that tracks people. */
    html += '<div class="aw-hp" aria-hidden="true">';
    html += '<label for="enqWebsite">Website</label>';
    html += '<input type="text" id="enqWebsite" name="enqWebsite" tabindex="-1" autocomplete="off">';
    html += "</div>";

    /* ---- Consent --------------------------------------------------------
       Unticked, its own <label>, and specific about what is being agreed
       to. UK GDPR Article 7 wants consent to be a clear affirmative act and
       as easy to withdraw as to give, which is why the withdrawal route is
       stated right here rather than only in the policy. */
    html += '<div class="aw-consent">';
    html += '<input type="checkbox" id="enqConsent" name="enqConsent">';
    html += '<label for="enqConsent">Airwarm may hold these details and look ' +
      "up the public energy performance record for this address, in order to " +
      "reply to me about a heat pump. I can withdraw this at any time by " +
      "e-mailing <strong>hello@airwarm.co.uk</strong>.</label>";
    html += "</div>";

    html += '<p class="aw-small">We keep enquiries for 12 months from our ' +
      "last contact if they do not lead to work, then delete them. We will " +
      "not add you to a mailing list. The full detail is in our " +
      '<a href="../privacy/">privacy policy</a>.</p>';

    html += '<div class="aw-btn-row" style="margin-top:24px">';
    html += '<button type="submit" class="aw-btn aw-btn--primary" id="aw-enquiry-submit">' +
      "Send this to Airwarm</button>";
    html += "</div>";

    html += "</form>";
    html += "</div>";

    return html;
  }

  /* Validates, then makes the single network request in this file.
     `answers` is the assessment data already in memory; it is sent alongside
     the contact details so the reply can be about the actual property. */
  function submitEnquiry(formEl, answers, result) {
    var errorEl = document.getElementById(ENQUIRY_ERROR_ID);
    var consent = document.getElementById("enqConsent");
    var honeypot = document.getElementById("enqWebsite");
    var missing = [];
    var invalidFields = [];

    clearInvalid(formEl);
    errorEl.textContent = "";

    ENQUIRY_FIELDS.forEach(function (field) {
      var el = document.getElementById(field.id);
      if (field.required && !el.value.trim()) {
        missing.push(field.label);
        invalidFields.push(el);
      }
    });

    /* A deliberately forgiving e-mail check. The only thing worth rejecting
       here is an address that obviously cannot work; anything stricter
       turns away real people with unusual addresses. */
    var emailEl = document.getElementById("enqEmail");
    if (emailEl.value.trim() && emailEl.value.indexOf("@") === -1) {
      missing.push("a working e-mail address");
      invalidFields.push(emailEl);
    }

    if (missing.length) {
      errorEl.textContent = "Please add " + listToSentence(missing) +
        " so we can reply to you.";
      markInvalid(invalidFields);
      invalidFields[0].focus();
      return;
    }

    /* Consent is checked separately and after the fields, so the message can
       be about consent specifically rather than buried in a list. */
    if (!consent.checked) {
      errorEl.textContent = "Please tick the box to confirm Airwarm may hold " +
        "these details, so we know we have your permission.";
      markInvalid([consent]);
      consent.focus();
      return;
    }

    /* Honeypot filled means an automated submission. Show the same success
       state rather than an error: telling a bot it failed only teaches it to
       try again. Nothing is sent. */
    if (honeypot.value) {
      showEnquirySent(formEl, makeReference());
      return;
    }

    var submittedAt = new Date();
    var reference = makeReference();

    var payload = {
      reference: reference,
      submittedAt: submittedAt.toISOString(),
      submittedAtLocal: submittedAt.toString(),
      name: document.getElementById("enqName").value.trim(),
      address: document.getElementById("enqAddress").value.trim(),
      postcode: document.getElementById("enqPostcode").value.trim(),
      email: emailEl.value.trim(),
      telephone: document.getElementById("enqPhone").value.trim(),
      preferredContact: document.getElementById("enqPreferred").value,
      consentGiven: true,
      consentAt: submittedAt.toISOString(),
      assessmentOutcome: result.outcome,
      assessmentOutcomeLabel: AIRWARM_TRIAGE_CONFIG.outcomeLabels[result.outcome],
      assessmentScore: result.score,
      /* The readable question-and-answer transcript. `answers` keeps the raw
         machine values alongside it, because those are what any later
         re-scoring would need. */
      transcript: readTranscript(),
      answers: answers
    };

    var submitBtn = document.getElementById("aw-enquiry-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    /* The body is JSON, but the Content-Type is deliberately text/plain.

       application/json makes this a "preflighted" cross-origin request: the
       browser sends an OPTIONS request first and refuses to POST unless that
       is answered with the right CORS headers. text/plain keeps it a simple
       request, which skips the preflight entirely. The receiving end parses
       the string as JSON, so nothing is lost.

       This matters because the endpoint is a Google Apps Script web app,
       which cannot answer an OPTIONS preflight. If you move to an endpoint
       that can, application/json is the tidier choice — change it here and
       in the receiving code together. */
    fetch(ENQUIRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function (response) {
      if (!response.ok) { throw new Error("HTTP " + response.status); }
      showEnquirySent(formEl, reference);
    }).catch(function () {
      /* Never lose the enquiry silently. The person has typed their details
         and is entitled to know it did not arrive, plus a route that works. */
      submitBtn.disabled = false;
      submitBtn.textContent = "Send this to Airwarm";
      errorEl.innerHTML = "That did not send, and we would rather tell you " +
        "than pretend. Please try again, or e-mail " +
        '<a href="mailto:hello@airwarm.co.uk">hello@airwarm.co.uk</a> or ' +
        'call <a href="tel:+441274947197">01274 947 197</a> ' +
        "&mdash; your answers are still on this page.";
      errorEl.focus();
    });
  }

  function showEnquirySent(formEl, reference) {
    var sent = document.createElement("div");
    sent.className = "aw-enquiry-sent";
    sent.setAttribute("role", "status");
    sent.setAttribute("tabindex", "-1");
    sent.innerHTML = "<h4>Thank you</h4>" +
      "<p>Your assessment has been sent to Airwarm. We will review the " +
      "information you have provided before contacting you to discuss the " +
      "next steps.</p>" +
      /* The reference is shown so someone can quote it if they ring before
         we have replied. It is a label for a conversation, not a lookup
         key — nothing is stored against it. */
      '<p class="aw-small">Your reference is <strong>' + reference +
      "</strong>. Quote it if you call before we get back to you.</p>" +
      '<p class="aw-small">Preparing for our April 2027 launch, so this is ' +
      "about reserving your place rather than booking an installation. If " +
      "you need us sooner, call <a href=\"tel:+441274947197\">01274 947 197</a>.</p>";
    formEl.parentNode.replaceChild(sent, formEl);
    sent.focus();
  }

  /* "a, b and c" — used in validation messages so they read like a sentence
     rather than a list of field names. */
  function listToSentence(items) {
    if (items.length === 1) { return items[0]; }
    return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
  }

  function renderResult(result) {
    var copy = OUTCOME_COPY[result.outcome];
    var label = AIRWARM_TRIAGE_CONFIG.outcomeLabels[result.outcome];

    var html = '<div class="aw-outcome ' + copy.className + '">';
    html += '<span class="aw-outcome__label">' + label + "</span>";
    html += "<h3>" + copy.heading + "</h3>";
    html += "<p>" + copy.body + "</p>";

    /* A result must never appear without a reason attached to it. If no
       specific obstacle was identified, say that plainly rather than leaving
       the visitor with a bare label. */
    if (result.reasons.length) {
      html += "<h4>What is driving that</h4><ul class=\"aw-ticks\">";
      result.reasons.forEach(function (reason) {
        html += "<li>" + reason + "</li>";
      });
      html += "</ul>";
    } else if (result.outcome !== "likely") {
      html += "<h4>What is driving that</h4>";
      if (result.notSureCount >= 3) {
        html += "<p>Nothing in your answers stands out as a specific " +
          "obstacle. What is holding the result back is missing information " +
          "&mdash; you answered &ldquo;not sure&rdquo; to several questions, " +
          "which is completely normal and not a mark against your home. Most " +
          "people do not know how their walls were built. A short " +
          "conversation would fill those gaps in quickly, and the answer " +
          "could easily improve.</p>";
      } else {
        html += "<p>There is no single obstacle here. The result reflects the " +
          "overall picture rather than one particular problem, which usually " +
          "means a few things would each need a small improvement rather than " +
          "one thing needing a big one. That is worth talking through, " +
          "because it is often the most fixable situation of the three.</p>";
      }
    }

    html += "<h4>A practical next step</h4><p>" + copy.next + "</p>";

    if (!result.inServiceArea) {
      html += "<p class=\"aw-small\">Your postcode area looks as though it " +
        "may be outside the Bradford, Leeds and Shipley area Airwarm is " +
        "starting with. Do still get in touch &mdash; we will tell you " +
        "straight away whether we can help or suggest looking elsewhere.</p>";
    }

    /* The e-mail and telephone routes stay whether or not the form is
       configured. Someone who has just read an unexpected result often wants
       to talk to a person rather than fill anything in, and that should never
       be the harder option. When the form is present these become the
       secondary route, which is only a change of heading. */
    html += '<h4 style="margin-top:32px">' +
      (ENQUIRY_ENDPOINT ? "Or talk to us directly" : "Talk to us about this") +
      "</h4>";
    /* These buttons sit on the WHITE outcome card, so the light-background
       secondary is aw-btn--outline. NOT aw-btn--secondary, which is white
       text on a transparent background with a white border — correct on a
       navy panel, invisible here. */
    html += '<div class="aw-btn-row">';
    html += '<a class="aw-btn ' +
      (ENQUIRY_ENDPOINT ? "aw-btn--outline" : "aw-btn--primary") +
      '" href="mailto:hello@airwarm.co.uk' +
      '?subject=Home%20Energy%20Assessment%20enquiry">E-mail hello@airwarm.co.uk</a>';
    /* Both halves of the number must match the footer: the tel: href is the
       full international form, the visible text keeps the UK grouping. */
    html += '<a class="aw-btn aw-btn--outline" href="tel:+441274947197">' +
      "Call 01274 947 197</a>";
    html += "</div>";

    html += '<p class="aw-small" style="margin-top:24px">This result is an ' +
      "indicative first step produced from your answers. It is not a " +
      "technical heat-loss survey and it is not a final decision &mdash; a " +
      "person at Airwarm makes that judgement, and will explain the " +
      "reasoning either way.</p>";

    /* This sentence is a privacy claim, so it has to track what the page
       actually does. Unconfigured, nothing can be transmitted at all. With
       the form present, the answers are still local until the visitor
       submits it — which is a different promise, and worth stating exactly. */
    if (ENQUIRY_ENDPOINT) {
      html += '<p class="aw-small">Your answers are still on your device. ' +
        "They reach Airwarm only if you fill in the form below and send it. " +
        "Closing this page without sending discards everything.</p>";
    } else {
      html += '<p class="aw-small">Your answers have not been sent anywhere. ' +
        "Nothing you typed has left this device or been stored. Closing this " +
        "page discards it.</p>";
    }

    html += "</div>";

    resultBox.innerHTML = html;
    resultBox.classList.remove("aw-hidden");

    /* ---- WIRE-UP POINT ------------------------------------------------
       The ONLY place in the site where contact details are collected or
       transmitted. Adding a second one makes the privacy policy untrue —
       extend this instead.

       The form renders only when ENQUIRY_ENDPOINT (top of this file) is set;
       unconfigured, the visitor gets the e-mail and telephone route and
       nothing is collected.

       It mounts OUTSIDE the assessment form, into #aw-enquiry-mount, because
       HTML forbids nested forms — injected inside the result panel the
       browser silently drops the <form> tag, leaving fields with no form
       around them and a send button that does nothing at all. Do not move
       this back into resultBox.
       ------------------------------------------------------------------ */
    var mount = document.getElementById("aw-enquiry-mount");
    if (ENQUIRY_ENDPOINT && mount) {
      mount.innerHTML = buildEnquiryForm();
    }
  }

  /* ---- Buttons ------------------------------------------------------- */
  form.addEventListener("click", function (event) {
    var next = event.target.closest("[data-aw-next]");
    var back = event.target.closest("[data-aw-back]");

    if (next) {
      event.preventDefault();
      var missing = stageIsComplete(stages[current]);
      if (missing.length) {
        errorBox.textContent = missing.length === 1
          ? "Please answer: " + missing[0]
          : "Please answer these questions before continuing: " + missing.join("; ");
        errorBox.focus();
        return;
      }
      if (current < totalStages - 1) {
        /* The final stage shows the result, so work it out on the way in.
           The answers and the result are kept in scope because the enquiry
           form sends them alongside the contact details — the whole point is
           that the reply is about the actual property, not a generic one. */
        if (current === totalStages - 2) {
          lastAnswers = readAnswers();
          lastResult = assess(lastAnswers);
          renderResult(lastResult);
        }
        showStage(current + 1);
      }
    }

    if (back) {
      event.preventDefault();
      if (current > 0) { showStage(current - 1); }
    }
  });

  /* The assessment form itself is never submitted. If a browser or a stray
     Enter key tries, stop it here. The enquiry form is a separate <form>
     inside the result panel and has its own handler below. */
  form.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  /* ---- The enquiry form ----------------------------------------------
     Delegated from the mount point, because the form does not exist in the
     document until a result has been rendered. This is the only listener in
     the file that can cause a network request. */
  var enquiryMount = document.getElementById("aw-enquiry-mount");
  if (enquiryMount) {
    enquiryMount.addEventListener("submit", function (event) {
      var enquiryForm = event.target.closest("#aw-enquiry-form");
      if (!enquiryForm) { return; }
      event.preventDefault();
      submitEnquiry(enquiryForm, lastAnswers, lastResult);
    });
  }

  /* Start on stage one with the progress indicator in step. */
  showStage(0);
}());
