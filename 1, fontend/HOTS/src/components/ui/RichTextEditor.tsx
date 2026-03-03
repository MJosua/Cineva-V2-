import React, { useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Image as ImageIcon,
    Link as LinkIcon,
    Undo,
    Redo
} from 'lucide-react';
import { Button } from './button';

export interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!editor) {
        return null;
    }

    const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result && typeof event.target.result === 'string') {
                    editor.chain().focus().setImage({ src: event.target.result }).run();
                }
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // apply link
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-input rounded-t-md">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-slate-200' : ''}`}
                type="button"
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-slate-200' : ''}`}
                type="button"
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-slate-200' : ''}`}
                type="button"
            >
                <Strikethrough className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-slate-300 mx-1" />

            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-slate-200' : ''}`}
                type="button"
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-slate-200' : ''}`}
                type="button"
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-slate-200' : ''}`}
                type="button"
            >
                <Quote className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-slate-300 mx-1" />

            <Button
                variant="ghost"
                size="sm"
                onClick={setLink}
                className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-slate-200' : ''}`}
                type="button"
            >
                <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 p-0"
                type="button"
            >
                <ImageIcon className="h-4 w-4" />
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={addImage}
                />
            </Button>

            <div className="w-px h-6 bg-slate-300 mx-1" />

            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="h-8 w-8 p-0"
                type="button"
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="h-8 w-8 p-0"
                type="button"
            >
                <Redo className="h-4 w-4" />
            </Button>
        </div>
    );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, minHeight = "150px" }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            })
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose-base max-w-none focus:outline-none p-3 min-h-[${minHeight}] cursor-text bg-white`,
            },
        },
    });

    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <div className="border border-input rounded-md overflow-hidden bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-shadow">
            <MenuBar editor={editor} />
            <div className={`editor-content-wrapper min-h-[${minHeight}]`}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
