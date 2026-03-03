# Component Registry Architecture

To enable dynamic rendering, we map string "types" from the JSON config to actual React components.

## Registry (`src/components/Engine/Registry.js`)
```javascript
import HeroBlock from "./Blocks/HeroBlock";
import TextBlock from "./Blocks/TextBlock";
import ImageBlock from "./Blocks/ImageBlock";
import CardBlock from "./Blocks/CardBlock";

export const COMPONENT_REGISTRY = {
    "hero": HeroBlock,
    "text": TextBlock,
    "image": ImageBlock,
    "card": CardBlock,
    "container": "container" // special case
};
```

## Mock Config (`src/data/mockEvents.js`)
We will create a config that replicates `TnCEventTw.jsx`:
```json
{
  "slug": "tw-2024",
  "theme": {
    "background": "linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)", // Approximate for now
    "textColor": "white"
  },
  "blocks": [
    {
      "type": "hero",
      "props": { "title": "Taiwan 2024 Event", "subtitle": "Terms & Conditions" }
    },
    {
       "type": "card",
       "props": {
          "children": [
             { "type": "text", "props": { "content": "1. Rule number one..." } }
          ]
       }
    }
  ]
}
```

## Next Steps
1. Create `src/index.css` to add the `background-gradient-event-tw` class if possible, or support it via dynamic styled-components.
2. Implement the `EnginePage` to iterate over `blocks` and render them using the Registry.
