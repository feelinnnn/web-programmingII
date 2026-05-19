"use client"
import "./lesson-page.css";
import Navbar from "../components/Navbar";

type EpisodeType = "video" | "document";

type Episode = {
  id: number;
  title: string;
  type: EpisodeType;
};

const episodes: Episode[] = [
  { id: 1, title: "Episode 1 : Lorem ipsum dolor sit amet", type: "video" },
  { id: 2, title: "Episode 2 : Lorem ipsum dolor sit amet", type: "video" },
  { id: 3, title: "Episode 3 : Lorem ipsum dolor sit amet", type: "video" },
  { id: 4, title: "Episode 4 : Lorem ipsum dolor sit amet", type: "document" },
  { id: 5, title: "Episode 5 : Lorem ipsum dolor sit amet", type: "document" },
  { id: 6, title: "Episode 6 : Lorem ipsum dolor sit amet", type: "document" },
  { id: 7, title: "Episode 7 : Lorem ipsum dolor sit amet", type: "document" },
  
];

export default function VideoPage() {
  return (
    
    <div className="page">
      {/* Sidebar */}
      <Navbar />

      {/* Main Content */}
      <div className="main">
        <div className="content-card">
          {/* Video Player */}
          <div className="video-player">
            <div className="play-button">
              <img src="/icon/play-icon.png" alt="Play" />
            </div>
          </div>

          {/* Video Info */}
          <h2 className="video-title">Video Title # 1</h2>
          <p className="video-description">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum cursus viverra
            tempus. Curabitur a risus ac metus lacinia viverra. Phasellus pretium massa volutpat
            arcu ultrices ullamcorper. Phasellus tempus feugiat diam in interdum. Fusce posuere
            tempus leo, sed lobortis velit accumsan eget. Sed convallis a metus eget efficitur.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum cursus viverra
            tempus. Curabitur a risus ac metus lacinia viverra.empus feugiat diam in interdum. Fusce posuere
            tempus leo, sed lobortis velit accumsan eget. Sed convallis a metus eget efficitur.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum cursus viverra
            tempus. Curabitur a risus ac metus lacinia viverra.
          </p>

          <div className="submit-row">
            <button className="submit-btn">submit</button>
          </div>
        </div>
      </div>

      {/* Episode Sidebar */}
      <div className="episode-sidebar">
        {episodes.map((episode: Episode, i: number) => (
          <div key={episode.id}>
            <div className="episode-item">
              <div className="episode-icon">
                <img
                  src={episode.type === "video" ? "/icon/video-icon.png" : "/icon/doc-icon.png"}
                  alt={episode.type}
                />
              </div>
              <span className="episode-title">{episode.title}</span>
            </div>

            {i < episodes.length - 1 && <div className="connector" />}
          </div>
        ))}
      </div>
    </div>
  );
}