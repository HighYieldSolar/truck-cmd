"use client";

import SettingsLayout from "@/components/settings/SettingsLayout";
import ProfileSettings from "@/components/settings/ProfileSettings";

export default function SettingsPage() {
  return (
    <SettingsLayout>
      <ProfileSettings />
    </SettingsLayout>
  );
}