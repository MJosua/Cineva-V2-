import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Box } from "@chakra-ui/react";

export default function RichTextEditor({ value, onChange }) {
    return (
        <Box
            sx={{
                '.ql-container': { minHeight: '150px', fontSize: '14px' },
                '.ql-editor': { minHeight: '150px' }
            }}
        >
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={{
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                    ]
                }}
            />
        </Box>
    );
}
