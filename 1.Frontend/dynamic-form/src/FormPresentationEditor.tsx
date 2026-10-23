import { useEffect, useRef, useState } from "react";
import type {
  DynamicFormAppearanceSchema,
  DynamicFormBackgroundSchema,
  DynamicFormBannerSchema,
  DynamicFormSchema,
  FormMediaItem,
  FormMediaLibraryAdapter,
} from "./types";

interface FormPresentationEditorProps {
  schema: DynamicFormSchema;
  mediaLibrary?: FormMediaLibraryAdapter;
  onChange: (schema: DynamicFormSchema) => void;
}

type MediaTarget = "banner" | "background";

const clampHeight = (value: number, fallback: number) => Math.min(480, Math.max(80, Number.isFinite(value) ? value : fallback));
const clampSpacing = (value: number, fallback = 0) => Math.min(320, Math.max(0, Number.isFinite(value) ? value : fallback));

export const FormPresentationEditor = ({ schema, mediaLibrary, onChange }: FormPresentationEditorProps) => {
  const [mediaTarget, setMediaTarget] = useState<MediaTarget | null>(null);
  const [gallery, setGallery] = useState<FormMediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const banner = schema.appearance?.banner;
  const background = schema.appearance?.background;
  const displayUrl = (url: string) => mediaLibrary?.resolveUrl?.(url) ?? url;

  const updateAppearance = (appearance: DynamicFormAppearanceSchema) => onChange({ ...schema, appearance });
  const updateBanner = (patch: Partial<DynamicFormBannerSchema>) => updateAppearance({
    ...(schema.appearance ?? {}),
    banner: { src: "", ...(banner ?? {}), ...patch },
  });
  const updateBackground = (patch: Partial<DynamicFormBackgroundSchema>) => updateAppearance({
    ...(schema.appearance ?? {}),
    background: { ...(background ?? {}), ...patch },
  });
  const removeAppearancePart = (key: "banner" | "background") => {
    const appearance = { ...(schema.appearance ?? {}) };
    delete appearance[key];
    onChange({ ...schema, appearance: Object.keys(appearance).length ? appearance : undefined });
  };
  const updateIntro = (patch: Partial<NonNullable<DynamicFormSchema["intro"]>>) => onChange({
    ...schema,
    intro: { ...(schema.intro ?? {}), ...patch },
  });

  useEffect(() => {
    if (!mediaTarget || !mediaLibrary) return;
    let active = true;
    setLoadingMedia(true);
    setMediaError("");
    const timer = window.setTimeout(() => {
      mediaLibrary.listImages(search).then((items) => {
        if (active) setGallery(items);
      }).catch((reason: unknown) => {
        if (active) setMediaError(reason instanceof Error ? reason.message : "Media library could not be loaded.");
      }).finally(() => {
        if (active) setLoadingMedia(false);
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mediaTarget, mediaLibrary, search]);

  const chooseMedia = (item: FormMediaItem) => {
    if (mediaTarget === "background") {
      updateBackground({ src: item.url, mediaId: item.id, source: "cms" });
    } else {
      updateBanner({ src: item.url, alt: banner?.alt || item.name, mediaId: item.id, source: "cms" });
    }
    setMediaTarget(null);
  };

  const beginUpload = (target: MediaTarget) => {
    setMediaTarget(target);
    window.setTimeout(() => uploadRef.current?.click(), 0);
  };

  const upload = async (file?: File) => {
    if (!file || !mediaLibrary?.uploadImage) return;
    if (!file.type.startsWith("image/")) {
      setMediaError("Please choose an image file.");
      return;
    }
    setUploading(true);
    setMediaError("");
    try {
      chooseMedia(await mediaLibrary.uploadImage(file));
    } catch (reason) {
      setMediaError(reason instanceof Error ? reason.message : "Image upload failed.");
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const mediaPicker = mediaTarget && mediaLibrary && (
    <div className="hdf-media-picker hdf-editor-wide">
      <div className="hdf-media-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${mediaTarget} image`} /><span>{loadingMedia ? "Loading..." : `${gallery.length} images`}</span></div>
      <div className="hdf-media-grid">{gallery.map((item) => <button type="button" key={item.id} onClick={() => chooseMedia(item)}><img src={displayUrl(item.url)} alt="" loading="lazy" /><span>{item.name}</span></button>)}{!loadingMedia && gallery.length === 0 && <p>No matching images found.</p>}</div>
    </div>
  );

  return (
    <details className="hdf-presentation-editor" open>
      <summary>
        <span className="hdf-presentation-icon" aria-hidden="true">Aa</span>
        <span><strong>Form appearance and introduction</strong><small>Background, banner, campaign copy, and respondent-facing presentation</small></span>
        <span className={`hdf-presentation-status ${banner?.src || background?.src ? "is-active" : ""}`}>{banner?.src || background?.src ? "Visuals ready" : "No images"}</span>
      </summary>
      <div className="hdf-presentation-body">
        <section className="hdf-banner-editor">
          <div className="hdf-presentation-heading"><div><h3>Header banner</h3><p>Add a campaign image above the form title.</p></div>{banner?.src && <button type="button" className="hdf-text-danger" onClick={() => removeAppearancePart("banner")}>Remove banner</button>}</div>
          {banner?.src ? <div className="hdf-banner-editor-preview" style={{ height: clampHeight(banner.height ?? 220, 220) }}><img src={displayUrl(banner.src)} alt={banner.alt ?? "Form banner preview"} style={{ objectFit: banner.fit ?? "cover", objectPosition: banner.position ?? "center" }} /></div> : <button type="button" className="hdf-banner-empty" onClick={() => mediaLibrary ? setMediaTarget("banner") : undefined}><strong>Add a banner</strong><span>Choose, upload, or paste an image URL.</span></button>}
          <div className="hdf-banner-actions">
            {mediaLibrary && <button type="button" onClick={() => setMediaTarget(mediaTarget === "banner" ? null : "banner")}>{mediaTarget === "banner" ? "Close gallery" : "Choose from Media Gallery"}</button>}
            {mediaLibrary?.uploadImage && <button type="button" disabled={uploading} onClick={() => beginUpload("banner")}>{uploading && mediaTarget === "banner" ? "Uploading..." : "Upload image"}</button>}
          </div>
          <div className="hdf-editor-grid hdf-banner-fields">
            <label className="hdf-editor-wide">Image URL<input value={banner?.src ?? ""} placeholder="https://... or /public/image.png" onChange={(event) => updateBanner({ src: event.target.value, source: "url", mediaId: undefined })} /></label>
            <label className="hdf-editor-wide">Alternative text<input value={banner?.alt ?? ""} placeholder="Describe the banner for screen readers" onChange={(event) => updateBanner({ alt: event.target.value })} /></label>
            <label>Image fit<select value={banner?.fit ?? "cover"} onChange={(event) => updateBanner({ fit: event.target.value as DynamicFormBannerSchema["fit"] })}><option value="cover">Cover area</option><option value="contain">Show full image</option></select></label>
            <label>Image position<select value={banner?.position ?? "center"} onChange={(event) => updateBanner({ position: event.target.value as DynamicFormBannerSchema["position"] })}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label>
            <label>Desktop height<input type="number" min="80" max="480" value={banner?.height ?? 220} onChange={(event) => updateBanner({ height: clampHeight(Number(event.target.value), 220) })} /></label>
            <label>Mobile height<input type="number" min="80" max="480" value={banner?.mobileHeight ?? 160} onChange={(event) => updateBanner({ mobileHeight: clampHeight(Number(event.target.value), 160) })} /></label>
          </div>
        </section>

        <section className="hdf-background-editor">
          <div className="hdf-presentation-heading"><div><h3>Page background</h3><p>Place a color, pattern, or campaign artwork behind the form card.</p></div>{(background?.src || background?.color) && <button type="button" className="hdf-text-danger" onClick={() => removeAppearancePart("background")}>Reset</button>}</div>
          <div className="hdf-background-preview" style={{ backgroundColor: background?.color || "#eef2f7", backgroundImage: background?.src ? `url(${JSON.stringify(displayUrl(background.src))})` : undefined, backgroundPosition: background?.position ?? "center", backgroundSize: background?.fit === "repeat" ? "auto" : background?.fit ?? "cover", backgroundRepeat: background?.fit === "repeat" ? "repeat" : "no-repeat" }}><span>Form card</span></div>
          <div className="hdf-banner-actions">
            {mediaLibrary && <button type="button" onClick={() => setMediaTarget(mediaTarget === "background" ? null : "background")}>{mediaTarget === "background" ? "Close gallery" : "Choose from Media Gallery"}</button>}
            {mediaLibrary?.uploadImage && <button type="button" disabled={uploading} onClick={() => beginUpload("background")}>{uploading && mediaTarget === "background" ? "Uploading..." : "Upload image"}</button>}
          </div>
          <div className="hdf-editor-grid hdf-banner-fields">
            <label className="hdf-editor-wide">Background image URL<input value={background?.src ?? ""} placeholder="https://... or /public/background.png" onChange={(event) => updateBackground({ src: event.target.value, source: "url", mediaId: undefined })} /></label>
            <label>Background color<input type="color" value={background?.color || "#eef2f7"} onChange={(event) => updateBackground({ color: event.target.value })} /></label>
            <label>Image behavior<select value={background?.fit ?? "cover"} onChange={(event) => updateBackground({ fit: event.target.value as DynamicFormBackgroundSchema["fit"] })}><option value="cover">Fill background</option><option value="contain">Show full image</option><option value="repeat">Repeat pattern</option></select></label>
            <label>Image position<select value={background?.position ?? "center"} onChange={(event) => updateBackground({ position: event.target.value as DynamicFormBackgroundSchema["position"] })}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label>
            <label className="hdf-check"><input type="checkbox" checked={Boolean(background?.fixed)} onChange={(event) => updateBackground({ fixed: event.target.checked })} /> Keep background fixed while scrolling</label>
          </div>
          <details className="hdf-spacing-editor">
            <summary>Page spacing</summary>
            <p>Control space inside the background and outside the page canvas.</p>
            <div className="hdf-spacing-quick-actions">
              <button type="button" onClick={() => updateBackground({ paddingTop: 0 })}>Hide top space</button>
              <button type="button" onClick={() => updateBackground({ paddingBottom: 0 })}>Hide bottom space</button>
              <button type="button" onClick={() => updateBackground({ paddingTop: undefined, paddingRight: undefined, paddingBottom: undefined, paddingLeft: undefined, marginTop: undefined, marginRight: undefined, marginBottom: undefined, marginLeft: undefined })}>Use responsive defaults</button>
            </div>
            <div className="hdf-editor-grid hdf-spacing-fields">
              <label>Top padding<input type="number" min="0" max="320" value={background?.paddingTop ?? 48} onChange={(event) => updateBackground({ paddingTop: clampSpacing(Number(event.target.value), 48) })} /></label>
              <label>Right padding<input type="number" min="0" max="320" value={background?.paddingRight ?? 48} onChange={(event) => updateBackground({ paddingRight: clampSpacing(Number(event.target.value), 48) })} /></label>
              <label>Bottom padding<input type="number" min="0" max="320" value={background?.paddingBottom ?? 48} onChange={(event) => updateBackground({ paddingBottom: clampSpacing(Number(event.target.value), 48) })} /></label>
              <label>Left padding<input type="number" min="0" max="320" value={background?.paddingLeft ?? 48} onChange={(event) => updateBackground({ paddingLeft: clampSpacing(Number(event.target.value), 48) })} /></label>
              <label>Top margin<input type="number" min="0" max="320" value={background?.marginTop ?? 0} onChange={(event) => updateBackground({ marginTop: clampSpacing(Number(event.target.value)) })} /></label>
              <label>Right margin<input type="number" min="0" max="320" value={background?.marginRight ?? 0} onChange={(event) => updateBackground({ marginRight: clampSpacing(Number(event.target.value)) })} /></label>
              <label>Bottom margin<input type="number" min="0" max="320" value={background?.marginBottom ?? 0} onChange={(event) => updateBackground({ marginBottom: clampSpacing(Number(event.target.value)) })} /></label>
              <label>Left margin<input type="number" min="0" max="320" value={background?.marginLeft ?? 0} onChange={(event) => updateBackground({ marginLeft: clampSpacing(Number(event.target.value)) })} /></label>
            </div>
          </details>
        </section>

        {mediaError && <p className="hdf-media-error hdf-editor-wide" role="alert">{mediaError}</p>}
        {mediaPicker}
        <input ref={uploadRef} className="hdf-visually-hidden" type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} />

        <section className="hdf-intro-editor">
          <div className="hdf-presentation-heading"><div><h3>Introduction content</h3><p>Edit the campaign information shown before the questions.</p></div></div>
          <div className="hdf-editor-grid">
            <label className="hdf-editor-wide">Short description<textarea value={schema.description ?? ""} onChange={(event) => onChange({ ...schema, description: event.target.value })} /></label>
            <label className="hdf-editor-wide">Intro heading<input value={schema.intro?.subtitle ?? ""} onChange={(event) => updateIntro({ subtitle: event.target.value })} /></label>
            <label className="hdf-editor-wide">Intro message<textarea value={schema.intro?.body ?? ""} onChange={(event) => updateIntro({ body: event.target.value })} /></label>
            <label className="hdf-editor-wide">Location or important note<input value={schema.intro?.location ?? ""} onChange={(event) => updateIntro({ location: event.target.value })} /></label>
            <label>Social heading<input value={schema.intro?.socialTitle ?? ""} onChange={(event) => updateIntro({ socialTitle: event.target.value })} /></label>
            <label>Required-fields note<input value={schema.intro?.requiredNote ?? ""} onChange={(event) => updateIntro({ requiredNote: event.target.value })} /></label>
            <label className="hdf-editor-wide">Social lines, one per line<textarea value={(schema.intro?.socialLines ?? []).join("\n")} onChange={(event) => updateIntro({ socialLines: event.target.value.split("\n") })} /></label>
            <label className="hdf-editor-wide">Footer note<input value={schema.footerNote ?? ""} onChange={(event) => onChange({ ...schema, footerNote: event.target.value })} /></label>
          </div>
        </section>
      </div>
    </details>
  );
};
