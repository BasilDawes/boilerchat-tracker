import type { Resident, RoomGroup, TrackerStats } from "./types"

export const mockStats: TrackerStats = {
  doneCount: 0,
  totalCount: 0,
  percent: 0,
  remainingCount: 0,
  ratePerWeek: 0,
  dueText: "",
}

export const mockResidents: Resident[] = []

export const mockArchivedResidents: Resident[] = []

export const mockRoomGroups: RoomGroup[] = []
