import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "../services/api";
import { payMutationFee } from "../services/wallet";

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await endpoints.students.list();
      return response.data.data ?? [];
    }
  });
}

function useInvalidateStudents() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["students"] });
    queryClient.invalidateQueries({ queryKey: ["virtual-balance"] });
  };
}

export function useCreateStudent() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: async (payload) => {
      const feeTxHash = await payMutationFee();
      return endpoints.students.create({ ...payload, feeTxHash });
    },
    onSuccess: invalidate
  });
}

export function useUpdateStudent() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: async ({ studentId, payload }) => {
      const feeTxHash = await payMutationFee();
      return endpoints.students.update(studentId, { ...payload, feeTxHash });
    },
    onSuccess: invalidate
  });
}

export function useDeactivateStudent() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: async (studentId) => {
      const feeTxHash = await payMutationFee();
      return endpoints.students.deactivate(studentId, { feeTxHash });
    },
    onSuccess: invalidate
  });
}

export function useStudentMutations() {
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const deactivate = useDeactivateStudent();
  return { create, update, deactivate };
}
