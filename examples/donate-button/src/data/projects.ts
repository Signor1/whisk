export type Project = {
  name: string;
  region: string;
  progress: number;
  target: string;
  art: string;
};

export const PROJECTS: Project[] = [
  {
    name: "Bukit Lawang corridor",
    region: "North Sumatra · Indonesia",
    progress: 0.72,
    target: "12,000 trees",
    art: "linear-gradient(135deg, #1a3b2a 0%, #4a8a5a 60%, #7bb88a 100%)",
  },
  {
    name: "Mau Forest reseeding",
    region: "Rift Valley · Kenya",
    progress: 0.41,
    target: "8,500 trees",
    art: "linear-gradient(135deg, #2d5a3d 0%, #6a4a2a 50%, #e8b94c 100%)",
  },
  {
    name: "Cinque Terre regrowth",
    region: "Liguria · Italy",
    progress: 0.88,
    target: "5,000 trees",
    art: "linear-gradient(135deg, #4a8a5a 0%, #7bb88a 50%, #e8f1e8 100%)",
  },
];
