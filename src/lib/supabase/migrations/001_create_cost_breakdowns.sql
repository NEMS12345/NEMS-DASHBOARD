-- Create cost_breakdowns table
CREATE TABLE IF NOT EXISTS public.cost_breakdowns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    energy_data_id UUID NOT NULL REFERENCES public.energy_data(id) ON DELETE CASCADE,
    peak_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    off_peak_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    demand_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    fixed_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    taxes DECIMAL(10,2) NOT NULL DEFAULT 0,
    other_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cost_breakdowns_energy_data_id ON public.cost_breakdowns(energy_data_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cost_breakdowns_updated_at
    BEFORE UPDATE ON public.cost_breakdowns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.cost_breakdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cost breakdowns"
    ON public.cost_breakdowns
    FOR SELECT
    USING (
        energy_data_id IN (
            SELECT id FROM public.energy_data
            WHERE client_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own cost breakdowns"
    ON public.cost_breakdowns
    FOR INSERT
    WITH CHECK (
        energy_data_id IN (
            SELECT id FROM public.energy_data
            WHERE client_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own cost breakdowns"
    ON public.cost_breakdowns
    FOR UPDATE
    USING (
        energy_data_id IN (
            SELECT id FROM public.energy_data
            WHERE client_id = auth.uid()
        )
    )
    WITH CHECK (
        energy_data_id IN (
            SELECT id FROM public.energy_data
            WHERE client_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own cost breakdowns"
    ON public.cost_breakdowns
    FOR DELETE
    USING (
        energy_data_id IN (
            SELECT id FROM public.energy_data
            WHERE client_id = auth.uid()
        )
    );
