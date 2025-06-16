-- Add initial_message column to inquiries table
-- This stores the buyer's first message when creating an inquiry
-- The message will be displayed when admin facilitates the chat connection

-- Add the column to store buyer's initial message
ALTER TABLE inquiries
ADD COLUMN IF NOT EXISTS initial_message TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN inquiries.initial_message IS 'The initial message from the buyer when creating the inquiry. This message is displayed to the seller and becomes the first message in the conversation once admin facilitates the connection.';

-- Update any existing inquiries to have a default message if needed (optional)
-- UPDATE inquiries SET initial_message = 'Interested in learning more about this listing.' WHERE initial_message IS NULL;
