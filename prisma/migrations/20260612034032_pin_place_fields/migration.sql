-- AlterTable
ALTER TABLE "Pin" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "placeAddress" TEXT,
ADD COLUMN     "placeName" TEXT;

