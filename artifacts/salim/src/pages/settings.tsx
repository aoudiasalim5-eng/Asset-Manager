import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [mission, setMission] = useState(user?.mission ?? "");

  const mutation = useUpdateProfile({
    mutation: {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetMeQueryKey(), updated);
        toast({ title: "Profile updated", description: "Your changes have been saved." });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ data: { name, mission } });
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-5">Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-profile-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label>Personal mission statement</Label>
              <Textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="What is your deeper purpose? What drives you?"
                rows={3}
                data-testid="textarea-mission"
              />
              <p className="text-xs text-muted-foreground">Your mission anchors every objective you set</p>
            </div>

            <Button type="submit" disabled={mutation.isPending} data-testid="button-save-profile">
              {mutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </div>

        <div className="mt-4 bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-2">Account</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current plan</span>
            <span className="font-medium capitalize">{user?.plan}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
