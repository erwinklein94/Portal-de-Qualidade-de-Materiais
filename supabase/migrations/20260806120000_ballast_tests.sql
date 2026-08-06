-- Fluxo de ensaios de Lastro enviado pelas pedreiras.

create or replace function private.validate_quality_record_payload()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  area_code text;
  record_kind text;
  field_name text;
begin
  if not exists (
    select 1 from public.suppliers where id = new.supplier_id and area_id = new.area_id
  ) then
    raise exception 'O fornecedor informado não pertence à área do registro.';
  end if;

  select code into area_code from public.material_areas where id = new.area_id;
  record_kind := new.payload ->> 'record_type';

  if area_code = 'ballast' then
    if jsonb_typeof(new.payload) <> 'object'
      or record_kind <> 'ballast_test'
      or (new.payload ->> 'test_type') not in ('granulometry', 'fragment_shape')
      or (new.payload ->> 'test_status') not in ('approved', 'rejected') then
      raise exception 'Os campos obrigatórios do ensaio de Lastro não foram informados.';
    end if;
    return new;
  end if;

  if area_code = 'subcomponents' then
    if record_kind <> 'subcomponent_certificate'
      or nullif(btrim(new.payload ->> 'certificate_number'), '') is null
      or nullif(btrim(new.payload ->> 'lots'), '') is null
      or nullif(btrim(new.payload ->> 'certificate_path'), '') is null
      or nullif(btrim(new.payload ->> 'certificate_filename'), '') is null then
      raise exception 'Os campos obrigatórios do certificado de Subcomponentes não foram informados.';
    end if;
    return new;
  end if;

  if area_code <> 'concrete_sleeper' then
    if jsonb_typeof(new.payload) <> 'object'
      or nullif(btrim(new.payload ->> 'order_number'), '') is null
      or not (new.payload ?& array['total_order_volume', 'inspected_volume', 'rejected_volume', 'released_stock_volume'])
      or jsonb_typeof(new.payload -> 'total_order_volume') is distinct from 'number'
      or jsonb_typeof(new.payload -> 'inspected_volume') is distinct from 'number'
      or jsonb_typeof(new.payload -> 'rejected_volume') is distinct from 'number'
      or jsonb_typeof(new.payload -> 'released_stock_volume') is distinct from 'number' then
      raise exception 'Os campos obrigatórios do registro de qualidade não foram informados.';
    end if;
    if (new.payload ->> 'total_order_volume')::numeric < 0
      or (new.payload ->> 'inspected_volume')::numeric < 0
      or (new.payload ->> 'rejected_volume')::numeric < 0
      or (new.payload ->> 'released_stock_volume')::numeric < 0 then
      raise exception 'Os volumes devem ser iguais ou maiores que zero.';
    end if;
    return new;
  end if;

  if record_kind = 'concrete_production' then
    if nullif(btrim(new.payload ->> 'lot'), '') is null
      or (new.payload ->> 'project') not in ('FERRO NORTE', 'MALHA CENTRAL', 'FMT', 'MALHA PAULISTA BITOLA LARGA', 'MALHA PAULISTA BITOLA MISTA')
      or nullif(btrim(new.payload ->> 'gauge'), '') is null
      or nullif(btrim(new.payload ->> 'track'), '') is null
      or jsonb_typeof(new.payload -> 'production') is distinct from 'number'
      or jsonb_typeof(new.payload -> 'rejections') is distinct from 'number'
      or (new.payload ->> 'production')::numeric < 0
      or (new.payload ->> 'rejections')::numeric < 0 then
      raise exception 'Os campos obrigatórios da produção de dormentes não foram informados.';
    end if;
  elsif record_kind = 'concrete_release_test' then
    foreach field_name in array array[
      'project', 'responsible_inspector', 'supplier_name', 'sleeper_type', 'test_date', 'lot',
      'mold', 'cavity', 'track', 'sleeper_production_date', 'lot_series', 'lot_result'
    ] loop
      if nullif(btrim(new.payload ->> field_name), '') is null then
        raise exception 'Campo obrigatório ausente no ensaio de liberação: %.', field_name;
      end if;
    end loop;
    if (new.payload ->> 'project') not in ('FERRO NORTE', 'MALHA CENTRAL', 'FMT', 'MALHA PAULISTA BITOLA LARGA', 'MALHA PAULISTA BITOLA MISTA')
      or (new.payload ->> 'sleeper_type') not in ('Bitola Larga - Fast Clip', 'Bitola Larga - E-Clip', 'Bitola Mista - Fast Clip', 'Bitola Mista - E-Clip')
      or (new.payload ->> 'lot_result') not in ('approved', 'rejected')
      or (not (new.payload ? 'report_url') and not (new.payload ? 'report_path')) then
      raise exception 'Projeto, tipo, resultado ou relatório do ensaio é inválido.';
    end if;
    foreach field_name in array array[
      'positive_support_load', 'positive_center_load', 'bond_anchor_load', 'negative_support_load',
      'negative_center_load', 'shoulder_pullout_a', 'shoulder_pullout_b', 'support_base_inclination',
      'twist_between_supports', 'shoulder_twist_a', 'shoulder_twist_b', 'sleeper_length', 'sleeper_width',
      'height_between_supports', 'middle_height', 'internal_shoulder_distance', 'shoulder_height_check'
    ] loop
      if jsonb_typeof(new.payload -> field_name) is distinct from 'number' then
        raise exception 'Medição obrigatória ausente ou inválida: %.', field_name;
      end if;
    end loop;
    if (new.payload ->> 'sleeper_type') like 'Bitola Mista%'
      and (jsonb_typeof(new.payload -> 'shoulder_pullout_c') is distinct from 'number'
        or jsonb_typeof(new.payload -> 'shoulder_twist_c') is distinct from 'number') then
      raise exception 'As medições da Ombreira C são obrigatórias para Bitola Mista.';
    end if;
  elsif record_kind = 'concrete_databook' then
    if nullif(btrim(new.payload ->> 'production_record_id'), '') is null
      or nullif(btrim(new.payload ->> 'lot'), '') is null
      or nullif(btrim(new.payload ->> 'production_date'), '') is null
      or (not (new.payload ? 'report_url') and not (new.payload ? 'report_path')) then
      raise exception 'Os campos obrigatórios do Data Book não foram informados.';
    end if;
    if not exists (
      select 1 from public.quality_records production
      where production.id = (new.payload ->> 'production_record_id')::uuid
        and production.supplier_id = new.supplier_id
        and production.area_id = new.area_id
        and production.payload ->> 'record_type' = 'concrete_production'
        and production.payload ->> 'lot' = new.payload ->> 'lot'
    ) then
      raise exception 'A produção associada ao Data Book não foi encontrada.';
    end if;
  else
    raise exception 'Tipo de registro inválido para Dormente de Concreto.';
  end if;

  return new;
end;
$$;

-- Os dados reais anteriores são preservados; somente as massas de demonstração são removidas.
delete from public.quality_records
where area_id = (select id from public.material_areas where code = 'ballast')
  and coalesce((payload ->> 'example_record')::boolean, false);
