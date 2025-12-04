import { PrismaClient, MembershipRole, ClubMembershipRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create 1 root admin user (platform owner)
  const rootAdminUser = await prisma.user.create({
    data: {
      name: "Root Admin User",
      email: "root@test.com",
      password: await hash("password123", 12),
      isRoot: true,
    },
  });

  // Create 1 organization admin user
  const orgAdminUser = await prisma.user.create({
    data: {
      name: "Organization Admin User",
      email: "orgadmin@test.com",
      password: await hash("password123", 12),
      isRoot: false,
    },
  });

  // Create 1 club admin user
  const clubAdminUser = await prisma.user.create({
    data: {
      name: "Club Admin User",
      email: "clubadmin@test.com",
      password: await hash("password123", 12),
      isRoot: false,
    },
  });

  // Create 1 coach user
  const coachUser = await prisma.user.create({
    data: {
      name: "Coach User",
      email: "coach@test.com",
      password: await hash("password123", 12),
      isRoot: false,
    },
  });

  // Create 1 player user (regular platform user)
  const playerUser = await prisma.user.create({
    data: {
      name: "Player User",
      email: "player@test.com",
      password: await hash("password123", 12),
      isRoot: false,
    },
  });

  // Create 1 organization
  const organization = await prisma.organization.create({
    data: {
      name: "Padel Sports Association",
      slug: "padel-sports-association",
      createdById: orgAdminUser.id,
    },
  });

  // Create organization membership for org admin
  const orgMembership = await prisma.membership.create({
    data: {
      userId: orgAdminUser.id,
      organizationId: organization.id,
      role: MembershipRole.ORGANIZATION_ADMIN,
    },
  });

  // Create 1 club linked to the organization
  const club = await prisma.club.create({
    data: {
      name: "Padel Club Central",
      location: "123 Main St, City Center",
      organizationId: organization.id,
      createdById: clubAdminUser.id,
    },
  });

  // Create club membership for club admin
  const clubMembership = await prisma.clubMembership.create({
    data: {
      userId: clubAdminUser.id,
      clubId: club.id,
      role: ClubMembershipRole.CLUB_ADMIN,
    },
  });

  // Create 3 courts
  const court1 = await prisma.court.create({
    data: {
      name: "Court 1",
      clubId: club.id,
      type: "padel",
      surface: "artificial",
      indoor: true,
      defaultPriceCents: 5000,
    },
  });

  const court2 = await prisma.court.create({
    data: {
      name: "Court 2",
      clubId: club.id,
      type: "padel",
      surface: "artificial",
      indoor: true,
      defaultPriceCents: 5000,
    },
  });

  const court3 = await prisma.court.create({
    data: {
      name: "Court 3",
      clubId: club.id,
      type: "padel",
      surface: "clay",
      indoor: false,
      defaultPriceCents: 4000,
    },
  });

  // Create coach entry for the coach user
  const coach = await prisma.coach.create({
    data: {
      userId: coachUser.id,
      clubId: club.id,
      bio: "Experienced padel coach with 10 years of teaching.",
    },
  });

  console.log("Seed data created successfully!");
  console.log({ 
    rootAdminUser, 
    orgAdminUser, 
    clubAdminUser, 
    coachUser, 
    playerUser, 
    organization, 
    orgMembership,
    club, 
    clubMembership,
    court1, 
    court2, 
    court3, 
    coach 
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
