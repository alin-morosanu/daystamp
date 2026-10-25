# Change or turn off the inline trigger

By default, typing `@@` opens the Daystamp list. You can use different characters, or turn the trigger off.

## Use a different trigger

1. Open **Settings → Daystamp**.
2. Under **Inline trigger**, change **Trigger**.

The trigger can be 1 to 5 characters and can't contain spaces. Pick something you don't type by accident, such as `;;`, `//d` or `!!`. Any characters work, including ones that are special in regular expressions.

## Avoid a clash with Natural Language Dates

The Natural Language Dates plugin also opens a popup after `@`. If it's enabled and your trigger starts with `@`, Daystamp shows a **Trigger conflict** warning in settings. Change the trigger to one that doesn't start with `@`, such as `;;`.

## Turn the trigger off

Turn off **Enable inline trigger**. Commands, the ribbon icon and the calendar keep working.

## Related

- [Inline trigger reference](../reference/inline-trigger.md)
