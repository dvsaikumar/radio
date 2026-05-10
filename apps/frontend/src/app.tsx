import { AudioPlayer } from './components/AudioPlayer';
import { Sidebar } from './components/Sidebar';

export function App() {
  return (
    <div class="app-container">
      <Sidebar />
      <div class="main-content">
        <header>
          <h1>Ramam</h1>
          <p>Premium Radio Streaming</p>
        </header>
        <main>
          <AudioPlayer />
        </main>
      </div>
    </div>
  );
}
