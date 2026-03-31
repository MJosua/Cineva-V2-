# Block Editor: Nesting & Styling

## CSS Specificity
When working with nested blocks in the `BlockEditor`, generic global styles can often override local WYSIWYG settings. 

## Best Practices
- **Layer Injection**: Ensure new layers are correctly appended to the `parent_id` to maintain hierarchical integrity.
- **Priority Styling**: Use more specific CSS selectors or inline styles for user-defined block properties to ensure they take precedence over the base engine styles.
- **Visibility**: When editing nested text, ensure the editor handles focus and overlay depth correctly to prevent "lost" cursors inside parent containers.
