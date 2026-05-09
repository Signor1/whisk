"use client";

import dynamic from "next/dynamic";

const CreateForm = dynamic(
  () => import("./form").then((m) => ({ default: m.CreateForm })),
  { ssr: false },
);

export function CreateClientGate() {
  return <CreateForm />;
}
