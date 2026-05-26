import { PROJECTS, type Project } from "../data/projects";

export function Projects() {
  return (
    <section id="projects" className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-fern">
          Active projects
        </p>
        <h2 className="m-0 font-display text-3xl tracking-tight text-canopy">
          Where your trees go in.
        </h2>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {PROJECTS.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-paper transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(15,42,29,0.18)]">
      <div
        className="aspect-[5/3] w-full"
        style={{ background: project.art }}
      />
      <div className="flex flex-col gap-2 p-4">
        <h3 className="m-0 font-display text-[17px] text-canopy">
          {project.name}
        </h3>
        <p className="m-0 text-[12px] text-ink-muted">{project.region}</p>
        <div className="mt-2 flex items-baseline justify-between text-[11px] text-ink-muted">
          <span>{Math.round(project.progress * 100)}% planted</span>
          <span>of {project.target}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full"
            style={{
              width: `${project.progress * 100}%`,
              background: "linear-gradient(90deg, #2d5a3d 0%, #7bb88a 100%)",
            }}
          />
        </div>
      </div>
    </article>
  );
}
