# Cloudinary Certification Quiz with PostgreSQL and Drizzle ORM

This project is a quiz application designed to help users prepare for the Cloudinary certification exam. It uses PostgreSQL for data persistence and Drizzle ORM for database interactions.

## Database Setup

### Prerequisites

- PostgreSQL 14.0 or higher
- Node.js 18.x or higher
- npm or yarn

### Setting Up PostgreSQL

1. **Install PostgreSQL**

   For Ubuntu/Debian:

   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

   For macOS (using Homebrew):

   ```bash
   brew install postgresql
   brew services start postgresql
   ```

   For Windows, download the installer from [postgresql.org](https://www.postgresql.org/download/windows/).

2. **Create a Database for the Application**

   ```bash
   # Log in to PostgreSQL
   sudo -u postgres psql

   # Create the database
   CREATE DATABASE cloudinary_quiz;

   # Create a user (replace 'myuser' and 'mypassword' with your preferred credentials)
   CREATE USER myuser WITH ENCRYPTED PASSWORD 'mypassword';

   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE cloudinary_quiz TO myuser;

   # Exit PostgreSQL
   \q
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the root directory with the following variables:

   ```
   DATABASE_URL=postgres://myuser:mypassword@localhost:5432/cloudinary_quiz
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Make sure to replace `myuser` and `mypassword` with the credentials you created in the previous step.

## Setting Up the Application

1. **Install Dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Generate and Apply Database Migrations**

   ```bash
   # Generate migrations from your schema
   npm run db:generate

   # Push migrations to the database
   npm run db:push
   ```

3. **Seed the Database with Initial Questions**

   ```bash
   npm run db:seed
   ```

   This will create initial questions for each topic and difficulty level, using OpenAI to generate realistic certification questions.

4. **Start the Development Server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open the Application**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Management

### Drizzle Studio

You can use Drizzle Studio to visualize and manage your database:

```bash
npm run db:studio
```

This will start a web interface at `http://localhost:4983` where you can view and edit your database tables.

### Updating the Schema

When you make changes to the schema in `db/schema.ts`:

1. Generate new migrations:

   ```bash
   npm run db:generate
   ```

2. Apply the migrations:
   ```bash
   npm run db:push
   ```

## Database Schema

The database consists of the following main tables:

- **questions**: Stores all quiz questions
- **options**: Stores the options for each question
- **quizzes**: Tracks quiz sessions
- **quiz_questions**: Joins quizzes with questions and stores user answers
- **topic_performance**: Tracks performance by topic for each quiz

For a detailed view of the schema, see `db/schema.ts`.

## API Routes

The application provides the following API endpoints:

- `GET /api/questions`: Get questions (with optional topic and difficulty filters)
- `POST /api/questions`: Generate new questions and save them to the database
- `GET /api/quizzes`: Get quiz history or statistics
- `POST /api/quizzes`: Create a new quiz
- `POST /api/quizzes/[quizId]/answer`: Answer a question in a quiz
- `POST /api/quizzes/[quizId]/complete`: Complete a quiz and get results
- `GET /api/admin/stats`: Get database statistics

## Data Reuse Strategy

This application implements a smart strategy for question management:

1. **Database Persistence**: All generated questions are stored in PostgreSQL for reuse
2. **Question Lookup**: Before generating new questions, it checks if suitable questions already exist in the database
3. **Selective Generation**: Only generates new questions when necessary, saving API tokens
4. **Admin Tools**: Provides tools for managing the question database and pre-generating questions

This approach significantly reduces OpenAI API usage while maintaining a high-quality quiz experience.
