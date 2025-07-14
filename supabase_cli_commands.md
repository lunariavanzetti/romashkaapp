# Supabase CLI Commands for Schema Extraction

## If you have Supabase CLI installed:

### 1. Install Supabase CLI (if not installed)
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link to your project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Extract complete schema
```bash
supabase db dump --schema-only > current_schema.sql
```

### 5. Extract just the public schema
```bash
supabase db dump --schema-only --schema public > public_schema.sql
```

## To find your project reference:
1. Go to your Supabase dashboard
2. Look at the URL: https://supabase.com/dashboard/project/YOUR_PROJECT_REF
3. Copy the YOUR_PROJECT_REF part

## Alternative: Direct Database Connection
If you have direct access to your database:

```bash
pg_dump -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres --schema-only > schema.sql
```

Replace YOUR_PROJECT_REF with your actual project reference. 