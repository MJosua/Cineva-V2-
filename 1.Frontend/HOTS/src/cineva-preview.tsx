/** Standalone dummy-only entry: bypasses neither real auth nor production API policies. */
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HashRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import {store} from './store';
import {HeaderProvider} from './contexts/HeaderContext';
import {CinevaProgram} from './features/cineva-shared/CinevaProgram';
import {CinevaVendorTheme} from './features/cineva-shared/CinevaVendorTheme';
import {Button} from './components/ui/button';
import './index.css';
function Preview(){const [dark,setDark]=useState(false);return <Provider store={store}><HeaderProvider><CinevaVendorTheme><div className="flex justify-end border-b border-border bg-background px-4 py-2 text-foreground"><Button variant="ghost" size="sm" onClick={()=>{document.documentElement.classList.toggle('dark',!dark);setDark(!dark);}}>{dark?'Tema terang':'Tema gelap'}</Button></div><HashRouter><CinevaProgram basePath=""/></HashRouter></CinevaVendorTheme></HeaderProvider></Provider>;}
createRoot(document.getElementById('root')!).render(<Preview/>);
