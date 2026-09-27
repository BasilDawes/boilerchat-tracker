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
    lastSeen: "8/1",
    domains: [
      {
        id: "d1",
        title: "Domain 1",
        content: "- likes class\n- has friends",
      },
      {
        id: "d2",
        title: "Domain 2",
        content: "",
      },
      {
        id: "d3",
        title: "Domain 3",
        content: "- looking for internship",
      },
      {
        id: "d4",
        title: "Domain 4",
        content: "",
      },
    ],
  },
  {
    id: "p2",
    name: "Person 2",
    roomNumber: "1102",
    lastSeen: "8/3",
    domains: [
      {
        id: "d1",
        title: "Domain 1",
        content: "- adjusted to campus\n- joined club",
      },
      {
        id: "d2",
        title: "Domain 2",
        content: "- met in hallway\n- doing well with courses",
      },
      {
        id: "d3",
        title: "Domain 3",
        content: "- studying for midterms",
      },
      {
        id: "d4",
        title: "Domain 4",
        content: "- plans to stay in dorm next year",
      },
    ],
  },
  {
    id: "p3",
    name: "Person 3",
    roomNumber: "1102",
    lastSeen: "7/28",
    domains: [
      {
        id: "d1",
        title: "Domain 1",
        content: "- quiet, studies in library",
      },
      {
        id: "d2",
        title: "Domain 2",
        content: "",
      },
    ],
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
