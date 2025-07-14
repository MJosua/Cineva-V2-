const { dbHOTS } = require('../../config/database');
const { decodeTokenHT } = require('../../config/encrypts');

const projectCommentController = {
  // Get comments for a project (adapted from ticket comments)
  getProjectComments: async (req, res) => {
    try {
      const { project_id } = req.params;
      const userId = req.user.user_id;

      const query = `
        SELECT 
          c.comment_id,
          c.project_id,
          c.user_id,
          c.comment,
          c.date_created,
          u.firstname,
          u.lastname,
          u.uid,
          c.file_url,
          c.file_name
        FROM t_comment c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.project_id = ?
        ORDER BY c.date_created DESC
      `;

      const [comments] = await dbHOTS.promise().execute(query, [project_id]);

      res.status(200).json({
        success: true,
        data: comments,
        message: 'Project comments retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching project comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch project comments',
        error: error.message
      });
    }
  },

  // Add comment to project (adapted from ticket comments)
  addProjectComment: async (req, res) => {
    try {
      const { project_id } = req.params;
      const { comment } = req.body;
      const userId = req.user.user_id;
      
      // Handle file upload if present
      let file_url = null;
      let file_name = null;
      
      if (req.file) {
        file_url = `/uploads/comments/${req.file.filename}`;
        file_name = req.file.originalname;
      }

      // Generate comment ID
      const commentId = `CMT${Date.now()}${userId}`;

      const insertQuery = `
        INSERT INTO t_comment
        (comment_id, project_id, user_id, comment, date_created, file_url, file_name)
        VALUES (?, ?, ?, ?, NOW(), ?, ?)
      `;

      await dbHOTS.promise().execute(insertQuery, [
        commentId,
        project_id,
        userId,
        comment,
        file_url,
        file_name
      ]);

      // Get the created comment with user details
      const selectQuery = `
        SELECT 
          c.comment_id,
          c.project_id,
          c.user_id,
          c.comment,
          c.date_created,
          u.firstname,
          u.lastname,
          u.uid,
          c.file_url,
          c.file_name
        FROM t_comment c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.comment_id = ?
      `;

      const [newComment] = await dbHOTS.promise().execute(selectQuery, [commentId]);

      res.status(201).json({
        success: true,
        data: newComment[0],
        message: 'Comment added successfully'
      });
    } catch (error) {
      console.error('Error adding project comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment',
        error: error.message
      });
    }
  },

  // Update comment (optional enhancement)
  updateProjectComment: async (req, res) => {
    try {
      const { comment_id } = req.params;
      const { comment } = req.body;
      const userId = req.user.user_id;

      // Check if user owns the comment
      const checkQuery = `SELECT user_id FROM t_comment WHERE comment_id = ?`;
      const [existingComment] = await dbHOTS.promise().execute(checkQuery, [comment_id]);

      if (existingComment.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      if (existingComment[0].user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own comments'
        });
      }

      const updateQuery = `
        UPDATE t_comment 
        SET comment = ?, date_created = NOW()
        WHERE comment_id = ?
      `;

      await dbHOTS.promise().execute(updateQuery, [comment, comment_id]);

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully'
      });
    } catch (error) {
      console.error('Error updating project comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment',
        error: error.message
      });
    }
  },

  // Delete comment (optional enhancement)
  deleteProjectComment: async (req, res) => {
    try {
      const { comment_id } = req.params;
      const userId = req.user.user_id;

      // Check if user owns the comment
      const checkQuery = `SELECT user_id FROM t_comment WHERE comment_id = ?`;
      const [existingComment] = await dbHOTS.promise().execute(checkQuery, [comment_id]);

      if (existingComment.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      if (existingComment[0].user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own comments'
        });
      }

      const deleteQuery = `DELETE FROM t_comment WHERE comment_id = ?`;
      await dbHOTS.promise().execute(deleteQuery, [comment_id]);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment',
        error: error.message
      });
    }
  }
};

module.exports = projectCommentController;