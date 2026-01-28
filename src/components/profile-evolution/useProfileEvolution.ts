import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProfileEvolution } from './types';
import { mapDatabaseToProfile } from './utils';

export function useProfileEvolution() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>('all');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedYearA, setSelectedYearA] = useState<number | null>(null);
  const [selectedYearB, setSelectedYearB] = useState<number | null>(null);

  // Extract unique names and years
  const uniqueNames = useMemo(() => {
    const names = profiles
      .map((p) => p.employee_name)
      .filter((name): name is string => !!name && name.trim() !== '');
    return Array.from(new Set(names));
  }, [profiles]);

  const uniqueYears = useMemo(() => {
    const years = profiles.map((p) => p.year);
    return Array.from(new Set(years)).sort((a, b) => a - b);
  }, [profiles]);

  // Set default comparison years
  useEffect(() => {
    if (uniqueYears.length >= 2 && !selectedYearA && !selectedYearB) {
      setSelectedYearA(uniqueYears[uniqueYears.length - 2]);
      setSelectedYearB(uniqueYears[uniqueYears.length - 1]);
    } else if (uniqueYears.length === 1 && !selectedYearA) {
      setSelectedYearA(uniqueYears[0]);
    }
  }, [uniqueYears, selectedYearA, selectedYearB]);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const nameMatch = selectedName === 'all' || profile.employee_name === selectedName;
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(profile.year);
      return nameMatch && yearMatch;
    });
  }, [profiles, selectedName, selectedYears]);

  const toggleYear = useCallback((year: number) => {
    setSelectedYears((prev) => (prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]));
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedName('all');
    setSelectedYears([]);
  }, []);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch profiles
  const fetchProfiles = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profile_evolution')
        .select('*')
        .eq('user_id', user.id)
        .order('assessment_date', { ascending: true });

      if (error) throw error;

      const mappedData = (data || []).map(mapDatabaseToProfile);
      setProfiles(mappedData);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Erro ao carregar perfis');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user, fetchProfiles]);

  // Delete handler
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('profile_evolution').delete().eq('id', id);

        if (error) throw error;
        toast.success('Perfil removido com sucesso');
        fetchProfiles();
      } catch (error) {
        console.error('Error deleting profile:', error);
        toast.error('Erro ao remover perfil');
      }
    },
    [fetchProfiles]
  );

  return {
    // State
    profiles,
    filteredProfiles,
    loading,
    authLoading,
    dialogOpen,
    selectedName,
    selectedYears,
    selectedYearA,
    selectedYearB,
    uniqueNames,
    uniqueYears,
    userId: user?.id,
    // Setters
    setDialogOpen,
    setSelectedName,
    setSelectedYearA,
    setSelectedYearB,
    // Actions
    toggleYear,
    clearFilters,
    handleDelete,
    fetchProfiles,
  };
}
