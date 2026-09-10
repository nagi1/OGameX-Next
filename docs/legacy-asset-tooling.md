# Legacy asset tooling

Local tooling for safely exploring legacy JavaScript assets. It does not change
Vite inputs, production files, or public build output.

## In-game workflow

    npm run ingame:group
    npm run ingame:validate

Grouping writes descriptive feature folders and a review plan under ignored tmp
output. The manifest preserves the original execution order. Validation fails
unless reassembly is byte-identical; JavaScript is also syntax and minification
checked.

## Reuse for out-game JavaScript

    npm run asset:group -- --input=resources/js/outgame/file.js --output=tmp/outgame-chunks --plan=tmp/outgame-plan.json
    npm run asset:validate -- --input=resources/js/outgame/file.js --chunks=tmp/outgame-chunks

All paths must remain inside the project. Future CSS tooling can reuse the
manifest and validator with --type=css.

Use the generated plan to select one understandable OGame subsystem for a small
reviewed migration. Do not change runtime Vite inputs until browser-tested.
