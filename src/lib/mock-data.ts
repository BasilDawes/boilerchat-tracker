import type { Resident, RoomGroup, TrackerStats } from "./types"

export const mockStats: TrackerStats = {
  doneCount: 3,
  totalCount: 50,
  percent: 5,
  remainingCount: 37,
  ratePerWeek: 10,
  dueText: "due: 1 wk, 2 dy",
}

export const mockResidents: Resident[] = [
  {
    id: "p1",
    name: "Person 1",
    roomNumber: "1102",
    badge: "us",
    lastSeen: "8/1",
    domains: [
      {
        id: "d2",
        title: "Domain 2",
        status: "current",
        content: "",
      },
      {
        id: "d1",
        title: "Domain 1",
        status: "past",
        bullets: ["likes class", "has friends"],
      },
      {
        id: "d3",
        title: "Domain 3",
        status: "future",
      },
      {
        id: "d4",
        title: "Domain 4",
        status: "future",
      },
    ],
  },
  {
    id: "p2",
    name: "Person 2",
    roomNumber: "1102",
    badge: "checked",
    lastSeen: "8/3",
    domains: [
      {
        id: "d2",
        title: "Domain 2",
        status: "current",
        content: "Met in hallway, doing well with courses.",
      },
      {
        id: "d1",
        title: "Domain 1",
        status: "past",
        bullets: ["adjusted to campus", "joined club"],
      },
    ],
  },
  {
    id: "p3",
    name: "Person 3",
    roomNumber: "1102",
    lastSeen: "7/28",
  },
  {
    id: "p4",
    name: "Person 4",
    roomNumber: "1102",
    lastSeen: "7/25",
  },
  {
    id: "p5",
    name: "Person 5",
    roomNumber: "1201",
    lastSeen: "8/2",
  },
]

export const mockArchivedResidents: Resident[] = [
  {
    id: "arch-1",
    name: "Archived 1",
    roomNumber: "1001",
    isArchived: true,
  },
  {
    id: "arch-2",
    name: "Archived 2",
    roomNumber: "1002",
    isArchived: true,
  },
  {
    id: "arch-3",
    name: "Archived 3",
    roomNumber: "1003",
    isArchived: true,
  },
]

export const mockRoomGroups: RoomGroup[] = [
  {
    roomNumber: "1102",
    residents: mockResidents.filter((r) => r.roomNumber === "1102"),
  },
  {
    roomNumber: "1201",
    residents: mockResidents.filter((r) => r.roomNumber === "1201"),
  },
]
