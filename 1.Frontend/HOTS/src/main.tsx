import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import '@hots/dynamic-form/styles.css'
import { CinevaCoreProvider } from './platform/CinevaCoreProvider'

createRoot(document.getElementById("root")!).render(<CinevaCoreProvider><App /></CinevaCoreProvider>);
