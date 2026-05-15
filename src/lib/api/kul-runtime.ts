import {
  assignKulTask as assignLiveKulTask,
  completeKulTask as completeLiveKulTask,
  createKul as createLiveKul,
  deleteKulFamilyMember as deleteLiveKulFamilyMember,
  deleteKulTask as deleteLiveKulTask,
  deleteKulEvent as deleteLiveKulEvent,
  fetchKulData as fetchLiveKulData,
  joinKul as joinLiveKul,
  leaveKul as leaveLiveKul,
  promoteKulMember as promoteLiveKulMember,
  reactToKulMessage as reactLiveKulMessage,
  removeKulMember as removeLiveKulMember,
  renameKul as renameLiveKul,
  saveKulEvent as saveLiveKulEvent,
  saveKulFamilyMember as saveLiveKulFamilyMember,
  sendKulMessage as sendLiveKulMessage,
} from '@/lib/api/kul';
import type { KulData, SaveKulEventPayload, SaveKulFamilyMemberPayload } from '@/lib/api/kul';
import {
  assignMockKulTask,
  completeMockKulTask,
  createMockKul,
  deleteMockKulFamilyMember,
  fetchMockKulData,
  joinMockKul,
  leaveMockKul,
  promoteMockKulMember,
  reactMockKulMessage,
  removeMockKulMember,
  renameMockKul,
  saveMockKulEvent,
  saveMockKulFamilyMember,
  sendMockKulMessage,
} from '@/lib/mocks/kul';
import { selectRuntimeAdapter } from '@shared-core/runtime/selectRuntimeAdapter';

export type { KulData, SaveKulEventPayload, SaveKulFamilyMemberPayload } from '@/lib/api/kul';

const kulRuntimeApi = selectRuntimeAdapter({
  live: {
    fetchKulData: fetchLiveKulData,
    createKul: createLiveKul,
    joinKul: joinLiveKul,
    renameKul: async (userId: string, kulId: string, name: string) => renameLiveKul(kulId, name),
    promoteKulMember: async (userId: string, memberId: string) => promoteLiveKulMember(memberId),
    removeKulMember: async (userId: string, memberId: string) => removeLiveKulMember(memberId),
    assignKulTask: async (userId: string, payload: {
      kulId: string;
      title: string;
      description?: string | null;
      taskType: string;
      assignTo: string;
      dueDate?: string | null;
    }) => assignLiveKulTask({ userId, ...payload }),
    completeKulTask: completeLiveKulTask,
    sendKulMessage: sendLiveKulMessage,
    reactToKulMessage: async (userId: string, messageId: string, emoji: string) => reactLiveKulMessage(messageId, emoji),
    saveKulFamilyMember: saveLiveKulFamilyMember,
    deleteKulFamilyMember: async (userId: string, memberId: string) => deleteLiveKulFamilyMember(memberId),
    deleteKulTask: async (userId: string, taskId: string) => deleteLiveKulTask(taskId),
    deleteKulEvent: async (userId: string, eventId: string) => deleteLiveKulEvent(eventId),
    saveKulEvent: saveLiveKulEvent,
    leaveKul: leaveLiveKul,
    updateKul: async (userId: string, kulId: string, updates: any) => {
      const { updateKul: updateLiveKul } = await import('@/lib/api/kul');
      return updateLiveKul(kulId, updates);
    },
  },
  mock: {
    fetchKulData: fetchMockKulData,
    createKul: createMockKul,
    joinKul: joinMockKul,
    renameKul: renameMockKul,
    promoteKulMember: promoteMockKulMember,
    removeKulMember: removeMockKulMember,
    assignKulTask: assignMockKulTask,
    completeKulTask: completeMockKulTask,
    sendKulMessage: sendMockKulMessage,
    reactToKulMessage: reactMockKulMessage,
    saveKulFamilyMember: saveMockKulFamilyMember,
    deleteKulFamilyMember: deleteMockKulFamilyMember,
    deleteKulTask: async (userId: string, taskId: string) => { console.log('Mock deleteTask', taskId); },
    deleteKulEvent: async (userId: string, eventId: string) => { console.log('Mock deleteEvent', eventId); },
    saveKulEvent: saveMockKulEvent,
    leaveKul: leaveMockKul,
    updateKul: async (userId: string, kulId: string, updates: any) => {
      console.log('Mock updateKul', kulId, updates);
    },
  },
});

export async function fetchKulData(userId: string): Promise<KulData> {
  return kulRuntimeApi.fetchKulData(userId);
}

export async function createKul(payload: { name: string; emoji: string }) {
  return kulRuntimeApi.createKul(payload);
}

export async function joinKul(inviteCode: string) {
  return kulRuntimeApi.joinKul(inviteCode);
}

export async function renameKul(userId: string, kulId: string, name: string) {
  return kulRuntimeApi.renameKul(userId, kulId, name);
}

export async function updateKul(userId: string, kulId: string, updates: { name?: string; avatar_emoji?: string; cover_url?: string | null }) {
  return kulRuntimeApi.updateKul(userId, kulId, updates);
}

export async function promoteKulMember(userId: string, memberId: string) {
  return kulRuntimeApi.promoteKulMember(userId, memberId);
}

export async function removeKulMember(userId: string, memberId: string) {
  return kulRuntimeApi.removeKulMember(userId, memberId);
}

export async function assignKulTask(userId: string, payload: {
  kulId: string;
  title: string;
  description?: string | null;
  taskType: string;
  assignTo: string;
  dueDate?: string | null;
}) {
  return kulRuntimeApi.assignKulTask(userId, payload);
}

export async function completeKulTask(userId: string, taskId: string) {
  return kulRuntimeApi.completeKulTask(taskId, userId);
}

export async function sendKulMessage(userId: string, kulId: string, content: string) {
  return kulRuntimeApi.sendKulMessage(kulId, userId, content);
}

export async function reactToKulMessage(userId: string, messageId: string, emoji: string) {
  return kulRuntimeApi.reactToKulMessage(userId, messageId, emoji);
}

export async function saveKulFamilyMember(userId: string, payload: SaveKulFamilyMemberPayload) {
  return kulRuntimeApi.saveKulFamilyMember(userId, payload);
}

export async function deleteKulFamilyMember(userId: string, memberId: string) {
  return kulRuntimeApi.deleteKulFamilyMember(userId, memberId);
}

export async function deleteKulTask(userId: string, taskId: string) {
  return kulRuntimeApi.deleteKulTask(userId, taskId);
}

export async function deleteKulEvent(userId: string, eventId: string) {
  return kulRuntimeApi.deleteKulEvent(userId, eventId);
}

export async function saveKulEvent(userId: string, payload: SaveKulEventPayload) {
  return kulRuntimeApi.saveKulEvent(userId, payload);
}

export async function leaveKul(userId: string) {
  return kulRuntimeApi.leaveKul(userId);
}
