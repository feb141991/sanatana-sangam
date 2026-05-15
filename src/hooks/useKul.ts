'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignKulTask,
  completeKulTask,
  createKul,
  deleteKulFamilyMember,
  fetchKulData,
  joinKul,
  leaveKul,
  promoteKulMember,
  reactToKulMessage,
  removeKulMember,
  renameKul,
  saveKulEvent,
  saveKulFamilyMember,
  sendKulMessage,
  type KulData,
  type SaveKulEventPayload,
  type SaveKulFamilyMemberPayload,
} from '@/lib/api/kul-runtime';
import { queryKeys } from '@/lib/query-keys';

export function useKulQuery(userId: string, initialData?: KulData) {
  return useQuery({
    queryKey: queryKeys.kul.byUser(userId),
    queryFn: () => fetchKulData(userId),
    enabled: Boolean(userId),
    initialData,
  });
}

export function useKulMutations(userId: string) {
  const queryClient = useQueryClient();

  async function refreshKul() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.kul.byUser(userId) });
  }

  return {
    createKul: useMutation({
      mutationFn: (payload: { name: string; emoji: string }) => createKul(payload),
      onSuccess: refreshKul,
    }),
    joinKul: useMutation({
      mutationFn: (inviteCode: string) => joinKul(inviteCode),
      onSuccess: refreshKul,
    }),
    renameKul: useMutation({
      mutationFn: ({ kulId, name }: { kulId: string; name: string }) => renameKul(userId, kulId, name),
      onSuccess: refreshKul,
    }),
    promoteMember: useMutation({
      mutationFn: (memberId: string) => promoteKulMember(userId, memberId),
      onSuccess: refreshKul,
    }),
    removeMember: useMutation({
      mutationFn: (memberId: string) => removeKulMember(userId, memberId),
      onSuccess: refreshKul,
    }),
    assignTask: useMutation({
      mutationFn: (payload: {
        kulId: string;
        title: string;
        description?: string | null;
        taskType: string;
        assignTo: string;
        dueDate?: string | null;
      }) => assignKulTask(userId, payload),
      onSuccess: refreshKul,
    }),
    completeTask: useMutation({
      mutationFn: (taskId: string) => completeKulTask(userId, taskId),
      onSuccess: refreshKul,
    }),
    sendMessage: useMutation({
      mutationFn: ({ kulId, content }: { kulId: string; content: string }) => sendKulMessage(userId, kulId, content),
      onSuccess: refreshKul,
    }),
    reactToMessage: useMutation({
      mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) => reactToKulMessage(userId, messageId, emoji),
      onSuccess: refreshKul,
    }),
    saveFamilyMember: useMutation({
      mutationFn: (payload: SaveKulFamilyMemberPayload) => saveKulFamilyMember(userId, payload),
      onSuccess: refreshKul,
    }),
    deleteFamilyMember: useMutation({
      mutationFn: (memberId: string) => deleteKulFamilyMember(userId, memberId),
      onSuccess: refreshKul,
    }),
    saveEvent: useMutation({
      mutationFn: (payload: SaveKulEventPayload) => saveKulEvent(userId, payload),
      onSuccess: refreshKul,
    }),
    leaveKul: useMutation({
      mutationFn: () => leaveKul(),
      onSuccess: refreshKul,
    }),
  };
}
