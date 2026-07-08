import { db } from '../../../utils/db';
import { customerTasks, customerActivities, users } from '../../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const dealerId = event.context.dealerId;
  const userId = event.context.userId;
  const taskId = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!taskId) {
    throw createError({
      statusCode: 400,
      message: 'Task ID is required',
    });
  }

  // Verify task exists
  const existingTask = await db.query.customerTasks.findFirst({
    where: and(eq(customerTasks.id, taskId), eq(customerTasks.dealerId, dealerId)),
  });

  if (!existingTask) {
    throw createError({
      statusCode: 404,
      message: 'Task not found',
    });
  }

  // If reassigning, the new assignee must belong to this dealer (IDOR guard).
  if (body.assignedTo !== undefined && body.assignedTo !== null) {
    const u = await db.query.users.findFirst({
      where: and(eq(users.id, body.assignedTo), eq(users.dealerId, dealerId)),
      columns: { id: true },
    });
    if (!u) throw createError({ statusCode: 400, message: 'Assignee is not a member of this dealer' });
  }

  // Build update object
  const updates: any = { updatedAt: new Date() };

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.taskType !== undefined) updates.taskType = body.taskType;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.dueDate !== undefined) updates.dueDate = new Date(body.dueDate);
  if (body.dueTime !== undefined) updates.dueTime = body.dueTime;
  if (body.reminderDate !== undefined) updates.reminderDate = body.reminderDate ? new Date(body.reminderDate) : null;
  if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;
  if (body.status !== undefined) updates.status = body.status;
  if (body.outcome !== undefined) updates.outcome = body.outcome;
  if (body.completionNotes !== undefined) updates.completionNotes = body.completionNotes;

  // Handle completion
  if (body.status === 'completed' && existingTask.status !== 'completed') {
    updates.completedAt = new Date();
    updates.completedBy = userId;
  }

  // Update task
  await db.update(customerTasks)
    .set(updates)
    .where(and(eq(customerTasks.id, taskId), eq(customerTasks.dealerId, dealerId)));

  // Log activity if completed
  if (body.status === 'completed' && existingTask.status !== 'completed' && existingTask.customerId) {
    await db.insert(customerActivities).values({
      dealerId,
      customerId: existingTask.customerId,
      enquiryId: existingTask.enquiryId,
      taskId: taskId,
      activityType: 'task_completed',
      activityDate: new Date(),
      subject: `Task Completed: ${existingTask.title}`,
      description: body.completionNotes || `Task "${existingTask.title}" was marked as completed`,
      notes: body.outcome ? `Outcome: ${body.outcome}` : null,
      createdBy: userId,
      isSystemGenerated: false,
    });
  }

  // Fetch updated task
  const updatedTask = await db.query.customerTasks.findFirst({
    where: eq(customerTasks.id, taskId),
    with: {
      customer: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      assignedUser: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return {
    success: true,
    task: updatedTask,
  };
});
