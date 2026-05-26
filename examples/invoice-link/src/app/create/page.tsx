import { CreateClientGate } from "./client-gate";
import { SiteNav, SiteFooter } from "../chrome";

export default function CreatePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1240px] flex-col gap-7 px-4 py-5 sm:px-8 lg:gap-10">
      <SiteNav active="create" />
      <section className="flex-1">
        <CreateClientGate />
      </section>
      <SiteFooter />
    </main>
  );
}
