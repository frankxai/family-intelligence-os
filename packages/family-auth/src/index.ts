import type { FamilyRole } from "@family/core";

export type ActorContext = {
  familyId: string;
  actorId: string;
  actorRole: FamilyRole;
};

export function createDemoActorContext(): ActorContext {
  return {
    familyId: "demo_family",
    actorId: "demo_actor",
    actorRole: "agent"
  };
}

