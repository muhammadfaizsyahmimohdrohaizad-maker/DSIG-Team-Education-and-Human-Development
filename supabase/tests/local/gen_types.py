#!/usr/bin/env python3
"""Writes lib/database.types.ts from a database the migrations were applied to, in the shape
`supabase gen types typescript` produces (the CLI is not available in the build sandbox).

    supabase/tests/local/run.sh --keep            # prints the socket dir and port
    python3 supabase/tests/local/gen_types.py <socket dir> <port> > lib/database.types.ts

Includes the public and ref schemas: tables, enums, and the functions anon/authenticated may execute plus
the service-role jobs (import_reference, complete_past_bookings, purge_audit_log).
"""
import json
import subprocess
import sys

HOST, PORT = sys.argv[1], sys.argv[2]
DB = sys.argv[3] if len(sys.argv) > 3 else "rls"
SCHEMAS = ["public", "ref"]


def q(sql):
    out = subprocess.run(["psql", "-X", "-q", "-t", "-A", "-h", HOST, "-p", PORT, "-U", "postgres", "-d", DB, "-c", sql],
                         check=True, capture_output=True, text=True).stdout.strip()
    return json.loads(out) if out else []


enums = q("""select coalesce(json_agg(json_build_object('schema', n.nspname, 'name', t.typname,
             'values', (select json_agg(e.enumlabel order by e.enumsortorder) from pg_enum e where e.enumtypid = t.oid))
             order by n.nspname, t.typname), '[]')
           from pg_type t join pg_namespace n on n.oid = t.typnamespace
          where t.typtype = 'e' and n.nspname in ('public','ref')""")
enum_names = {(e["schema"], e["name"]) for e in enums}

cols = q("""select coalesce(json_agg(json_build_object('schema', c.table_schema, 'table', c.table_name, 'col', c.column_name,
             'udt', c.udt_name, 'udt_schema', c.udt_schema, 'dtype', c.data_type, 'nullable', c.is_nullable = 'YES',
             'has_default', c.column_default is not null or c.is_identity = 'YES',
             'generated', c.is_generated = 'ALWAYS' or c.identity_generation = 'ALWAYS')
             order by c.table_schema, c.table_name, c.ordinal_position), '[]')
           from information_schema.columns c join information_schema.tables t
             on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
          where c.table_schema in ('public','ref')""")

fks = q("""select coalesce(json_agg(json_build_object('schema', n.nspname, 'table', cl.relname, 'name', con.conname,
             'cols', (select json_agg(a.attname order by k.ord) from unnest(con.conkey) with ordinality k(attnum, ord)
                        join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum),
             'ref_schema', rn.nspname, 'ref_table', rc.relname,
             'ref_cols', (select json_agg(a.attname order by k.ord) from unnest(con.confkey) with ordinality k(attnum, ord)
                        join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.attnum),
             'one_to_one', exists (select 1 from pg_index i where i.indrelid = con.conrelid and i.indisunique
                                     and i.indpred is null and (i.indkey::int2[])::int2[] @> con.conkey and cardinality(con.conkey) = i.indnkeyatts))
             order by n.nspname, cl.relname, con.conname), '[]')
           from pg_constraint con join pg_class cl on cl.oid = con.conrelid join pg_namespace n on n.oid = cl.relnamespace
           join pg_class rc on rc.oid = con.confrelid join pg_namespace rn on rn.oid = rc.relnamespace
          where con.contype = 'f' and n.nspname in ('public','ref')""")

funcs = q("""select coalesce(json_agg(json_build_object('schema', n.nspname, 'name', p.proname,
             'args', (select coalesce(json_agg(json_build_object('name', a.name, 'type', format_type(a.typ, null),
                        'udt', (select typname from pg_type where oid = a.typ), 'default', a.ord > p.pronargs - p.pronargdefaults)
                        order by a.ord), '[]')
                      from unnest(p.proargnames[1:p.pronargs], p.proargtypes::oid[]) with ordinality a(name, typ, ord)),
             'retset', p.proretset, 'rettype', (select typname from pg_type where oid = p.prorettype),
             'ret_elem', (select t2.typname from pg_type t1 join pg_type t2 on t2.oid = t1.typelem where t1.oid = p.prorettype and t1.typelem <> 0),
             'out', (select coalesce(json_agg(json_build_object('name', p.proargnames[i], 'udt', (select typname from pg_type where oid = p.proallargtypes[i]),
                        'elem', (select t2.typname from pg_type t1 join pg_type t2 on t2.oid = t1.typelem where t1.oid = p.proallargtypes[i] and t1.typelem <> 0))
                        order by i), '[]')
                     from generate_subscripts(p.proallargtypes, 1) i where p.proargmodes[i] in ('o','t')))
             order by p.proname), '[]')
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.prokind = 'f'
            and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
            and (has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('anon', p.oid, 'execute')
                 or p.proname in ('import_reference', 'complete_past_bookings', 'purge_audit_log'))
            and p.prorettype <> 'trigger'::regtype""")

SCALAR = {
    "uuid": "string", "text": "string", "varchar": "string", "bpchar": "string", "date": "string", "time": "string",
    "timestamptz": "string", "timestamp": "string", "interval": "string", "int2": "number", "int4": "number",
    "int8": "number", "numeric": "number", "float4": "number", "float8": "number", "bool": "boolean",
    "jsonb": "Json", "json": "Json", "void": "undefined", "name": "string", "regprocedure": "string",
}


def ts(udt, udt_schema="public"):
    if udt.startswith("_"):
        return ts(udt[1:], udt_schema) + "[]"
    for s in (udt_schema, "public"):
        if (s, udt) in enum_names:
            return f'Database["{s}"]["Enums"]["{udt}"]'
    return SCALAR.get(udt, "unknown")


def ind(n):
    return " " * n


def emit_schema(schema):
    out = [f"  {schema}: {{", "    Tables: {"]
    tables = sorted({c["table"] for c in cols if c["schema"] == schema})
    for t in tables:
        tc = [c for c in cols if c["schema"] == schema and c["table"] == t]
        out.append(f"      {t}: {{")
        for kind in ("Row", "Insert", "Update"):
            out.append(f"        {kind}: {{")
            for c in tc:
                typ = ts(c["udt"], c["udt_schema"])
                if c["nullable"]:
                    typ += " | null"
                if kind == "Row":
                    out.append(f"          {c['col']}: {typ}")
                elif c["generated"]:
                    out.append(f"          {c['col']}?: never")
                elif kind == "Insert" and not (c["nullable"] or c["has_default"]):
                    out.append(f"          {c['col']}: {typ}")
                else:
                    out.append(f"          {c['col']}?: {typ}")
            out.append("        }")
        out.append("        Relationships: [")
        for f in [f for f in fks if f["schema"] == schema and f["table"] == t]:
            ref = f["ref_table"] if f["ref_schema"] == schema else f["ref_table"]
            out += ["          {",
                    f'            foreignKeyName: "{f["name"]}"',
                    f"            columns: {json.dumps(f['cols'])}",
                    f"            isOneToOne: {'true' if f['one_to_one'] else 'false'}",
                    f'            referencedRelation: "{ref}"',
                    f"            referencedColumns: {json.dumps(f['ref_cols'])}",
                    "          },"]
        out.append("        ]")
        out.append("      }")
    out.append("    }")
    out.append("    Views: {\n      [_ in never]: never\n    }")
    fs = [f for f in funcs if f["schema"] == schema and all(a["udt"] in SCALAR or a["udt"].lstrip("_") in SCALAR
          or ("public", a["udt"].lstrip("_")) in enum_names for a in f["args"])]
    if fs:
        out.append("    Functions: {")
        for f in fs:
            out.append(f"      {f['name']}: {{")
            if f["args"]:
                out.append("        Args: {")
                for a in f["args"]:
                    out.append(f"          {a['name']}{'?' if a['default'] else ''}: {ts(a['udt'])}")
                out.append("        }")
            else:
                out.append("        Args: never")
            if f["out"]:
                out.append("        Returns: {")
                for o in f["out"]:
                    out.append(f"          {o['name']}: {ts(o['udt'])}")
                out.append("        }[]")
            elif f["retset"]:
                out.append(f"        Returns: {ts(f['rettype'])}[]")
            else:
                out.append(f"        Returns: {ts(f['rettype'])}")
            out.append("      }")
        out.append("    }")
    else:
        out.append("    Functions: {\n      [_ in never]: never\n    }")
    es = [e for e in enums if e["schema"] == schema]
    if es:
        out.append("    Enums: {")
        for e in es:
            out.append(f"      {e['name']}: " + " | ".join(json.dumps(v) for v in e["values"]))
        out.append("    }")
    else:
        out.append("    Enums: {\n      [_ in never]: never\n    }")
    out.append("    CompositeTypes: {\n      [_ in never]: never\n    }")
    out.append("  }")
    return out


lines = [
    "// Database types for supabase-js, in the shape `supabase gen types typescript` writes.",
    "// GENERATED from the migrated schema by supabase/tests/local/gen_types.py; do not edit by hand.",
    "// Regenerate after any migration (see that file), or with `pnpm db:types` once the Supabase CLI is available.",
    "",
    "export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]",
    "",
    "export type Database = {",
]
for s in SCHEMAS:
    lines += emit_schema(s)
lines.append("}")
lines.append("""
type DefaultSchema = Database["public"]
type SchemaName = Exclude<keyof Database, "__InternalSupabase">

export type Tables<
  T extends keyof DefaultSchema["Tables"] | { schema: SchemaName },
  N extends T extends { schema: SchemaName } ? keyof Database[T["schema"]]["Tables"] : never = never,
> = T extends { schema: SchemaName }
  ? Database[T["schema"]]["Tables"][N & keyof Database[T["schema"]]["Tables"]] extends { Row: infer R } ? R : never
  : T extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][T] extends { Row: infer R } ? R : never : never

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"] | { schema: SchemaName },
  N extends T extends { schema: SchemaName } ? keyof Database[T["schema"]]["Tables"] : never = never,
> = T extends { schema: SchemaName }
  ? Database[T["schema"]]["Tables"][N & keyof Database[T["schema"]]["Tables"]] extends { Insert: infer I } ? I : never
  : T extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never : never

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"] | { schema: SchemaName },
  N extends T extends { schema: SchemaName } ? keyof Database[T["schema"]]["Tables"] : never = never,
> = T extends { schema: SchemaName }
  ? Database[T["schema"]]["Tables"][N & keyof Database[T["schema"]]["Tables"]] extends { Update: infer U } ? U : never
  : T extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]

export type Functions<T extends keyof DefaultSchema["Functions"]> = DefaultSchema["Functions"][T]
""")
print("\n".join(lines))
