import EventSettingsForm from "@/components/admin/EventSettingsForm";
import { getAdminSession } from "@/lib/auth";
import { getWeddingData } from "@/lib/invitation";
import { redirect } from "next/navigation";

export default async function EventPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const data = await getWeddingData();
  const settings = {
    ...data.settings,
    weddingDate: data.settings.weddingDate.slice(0, 10),
    rsvpDeadline: data.settings.rsvpDeadline?.slice(0, 10) || "",
    mapsUrl: data.settings.mapsUrl || "",
    latitude: data.settings.latitude,
    longitude: data.settings.longitude
  };
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Event</p>
        <h1 className="mt-2 font-serif text-4xl">Wedding Details</h1>
      </div>
      <EventSettingsForm settings={settings} />
    </div>
  );
}
