# Vehicle descriptions

Approved in conversation: preserve AutoGate/Nexgate dealer comments and offer three display modes in Settings → Vehicle Descriptions. Default to dealer comments plus AI description. Dealer comments appear first, verbatim, under their own heading. AI is supplemental and never replaces dealer comments. Whitespace-only content counts as blank; duplicate content appears once. Specs/features enrichment remains independent.

Store `vehicleDescriptions.mode` in the dealership settings JSON. Reads and writes use the authenticated dealership; public reads resolve the host tenant. Validate the three mode values and update only this JSON key. Use existing admin components, loading/error/save states and theme tokens. Render text through Vue interpolation.

Approaches: changing priority alone fixes the symptom but provides no choice; disabling all enrichment also removes specs. The approved approach separates description display from enrichment and adds a per-dealer setting.

Advertising feeds are managed separately. Do not alter their content or claim Google acceptance without identifying Blood's configured feed and checking its output. No outgoing advertising feed exists in this repository.
