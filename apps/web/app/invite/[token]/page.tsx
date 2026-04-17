import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invitations, workspaces } from "@syncspace/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AcceptInviteButton } from "./AcceptInviteButton";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
  });

  if (!invitation || invitation.status !== "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="rounded-xl border border-border bg-bg-surface p-8 max-w-sm w-full text-center space-y-3">
          <p className="text-xl">🔗</p>
          <h1 className="text-lg font-semibold">Invalid invitation</h1>
          <p className="text-sm text-text-muted">
            This invite link is no longer valid or has already been used.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="rounded-xl border border-border bg-bg-surface p-8 max-w-sm w-full text-center space-y-3">
          <p className="text-xl">⏰</p>
          <h1 className="text-lg font-semibold">Invitation expired</h1>
          <p className="text-sm text-text-muted">
            Ask the workspace owner to send a new invite.
          </p>
        </div>
      </div>
    );
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, invitation.workspaceId),
  });

  const session = await auth();
  if (!session?.user?.id) {
    // Not signed in — redirect to sign-in, then come back
    redirect(`/sign-in?callbackUrl=/invite/${token}`);
  }
  const userEmail = session.user.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="rounded-xl border border-border bg-bg-surface p-8 max-w-sm w-full text-center space-y-5">
        <p className="text-3xl">👋</p>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">
            You&rsquo;re invited to <span className="text-accent">{workspace?.name}</span>
          </h1>
          <p className="text-sm text-text-muted">
            Signed in as <span className="text-text">{userEmail}</span>
          </p>
        </div>
        <AcceptInviteButton token={token} />
      </div>
    </div>
  );
}
