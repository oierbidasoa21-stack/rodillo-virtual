import { STRAVA_UPLOAD_URL } from '../../recording/sessionFile';

interface Props {
  /** The session had simulated readings: nothing goes to Strava. */
  simulated: boolean;
  /** Name of the file just downloaded on save, if any. */
  downloaded: string | null;
  /** Downloads the file again (or for the first time). */
  onDownload: () => void;
}

/**
 * Upload to Strava without its API: the file is downloaded and Strava's own
 * upload page opens in another tab, where the user picks it (about 20 s).
 */
export default function StravaCard({ simulated, downloaded, onDownload }: Props) {
  if (simulated) {
    return (
      <p className="note strava-card">
        Sesión con sensores simulados: no se descarga ni se ofrece subir a Strava.
      </p>
    );
  }
  return (
    <div className="card strava-card">
      <p style={{ margin: 0 }}>
        {downloaded ? (
          <>
            Se ha descargado <b>{downloaded}</b>. Para subirla a Strava, abre su página de subida y
            elige ese archivo.
          </>
        ) : (
          <>Para subirla a Strava, descarga el archivo y elígelo en su página de subida.</>
        )}
      </p>
      <div className="actions" style={{ marginTop: 8 }}>
        <button type="button" className="btn" onClick={onDownload}>
          {downloaded ? 'Descargar otra vez' : 'Descargar archivo'}
        </button>
        <a
          className="btn primary"
          href={STRAVA_UPLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir Strava para subir
        </a>
      </div>
    </div>
  );
}
