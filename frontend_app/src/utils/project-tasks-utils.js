import dayjs from 'dayjs';
import stringSimilarity from 'string-similarity';

export const availableTasks = (project, projectTasks, CONFIG) => {
    const initialTasks = projectTasks?.filter((t) => t.project_default_task?.is_active);
    const tasks = initialTasks?.map((t) => ({
        ...t,
        number: `T-${String(t.project_default_task.order).padStart(3, "0")}`,
    }));
    const sortedTasks = tasks?.sort(
        (a, b) => a.project_default_task.order - b.project_default_task.order
    );
    let foundNotStarted = false;

    const filteredTasks = project?.hasPermission ? sortedTasks : sortedTasks?.filter(
        (t) => t.project_default_task?.project_stage?.name !== CONFIG.stages.permission
    );

    const nextTasks = filteredTasks?.filter((t) => {
        if (t.status !== "not started") return true;
        if (!foundNotStarted) {
            foundNotStarted = true;
            return true;
        }
        return false;
    });

    let finalTasks = [];

    if (project?.hasPermission) {
        const permissionTasks = sortedTasks?.filter(
            (t) => t.project_default_task?.project_stage?.name === CONFIG.stages.permission
        );
        finalTasks = [...nextTasks, ...permissionTasks];
    }
    else {
        finalTasks = nextTasks?.filter(
            (t) => t.project_default_task?.project_stage?.name !== CONFIG.stages.permission
        );
    }
    const uniqueFinalTasks = [...new Map(finalTasks?.map(task => [task?.project_default_task?.id, task])).values()];
    return uniqueFinalTasks;
}


export const totalPercentageProject = (project, CONFIG) => {
    const projectTasks = project?.projectDefaultTasks;
    const filteredTasks = project?.hasPermission ? projectTasks : projectTasks?.filter(
        (t) => t.project_default_task?.project_stage?.name !== CONFIG.stages.permission
    );
    const total = filteredTasks?.reduce((acc, t) => acc + t.percentage, 0);
    const percentage = total / filteredTasks.length || 0;
    return percentage;
}

export const totalPercentageProjectStage = (project, stage, CONFIG) => {
    const projectTasks = project?.projectDefaultTasks;
    const filteredTasks = project?.hasPermission ? projectTasks : projectTasks?.filter(
        (t) => t.project_default_task?.project_stage?.name !== CONFIG.stages.permission
    );
    const stageTasks = filteredTasks?.filter(
        (t) => t.project_default_task?.project_stage?.name === stage
    );
    const total = stageTasks?.reduce((acc, t) => acc + t.percentage, 0);
    const percentage = total / stageTasks.length || 0;
    return percentage;
}

export const getWorkOrders = (project, date=null, workTypeName=null) => {
    const workOrders = project?.workOrders || [];
    const realWorkOrders = date ?
        workOrders.filter(
            (wo) => dayjs(wo.start_date).format('YYYY-MM-DD').isSame(dayjs(date).format('YYYY-MM-DD'))
        ) :
        workOrders;
    const filteredWorkOrders = workTypeName ?
        realWorkOrders.filter(
            (wo) => wo.work_type?.name.toLowerCase().includes(workTypeName.toLowerCase())
        ) :
        realWorkOrders;
    return filteredWorkOrders;
};

export const getWorkOrderWorkers = (workOrder, roleName=null) => {
    let users = [];
    const installerCrews = workOrder?.installerCrews || workOrder?.installer_crews || [];
    if (installerCrews?.length > 0) {
        users = installerCrews.map(
            (crew) => crew.users_installers || crew.usersInstallers || []
        ).flat();
    }
    const usersAssignees = workOrder?.users_assignees || workOrder?.usersAssignees || [];
    if (usersAssignees?.length > 0) {
        users = [...users, ...usersAssignees];
    }
    const set = new Set();
    users = users.filter((user) => {
        const notAdded = !set.has(user.username);
        if (notAdded) {
            set.add(user.username);
            return true;
        }
        return false;
    });
    if (roleName) {
        users = users.filter(
            (user) => {
                const objRole = user?.userRole || user?.user_role;
                return objRole.name.toLowerCase().includes(roleName.toLowerCase())
            }
        );
    }
    users = users.map(
        (user) => ({
            ...user,
            name: `${user.first_name || user.firstName} ${user.last_name || user.lastName}`.trim(),
        })
    );
    return users;
}

export const getWorkOrderAssistants = (workOrder) => {
    let assistants = [];
    const installerCrews = workOrder?.installerCrews || workOrder?.installer_crews || [];
    
    if (installerCrews?.length > 0) {
        assistants = installerCrews.map(
            (crew) => crew.users_helpers || crew.usersHelpers || []
        ).flat();
        assistants = assistants.map(
            (user) => ({
                ...user,
                id: dayjs().unix() + Math.random(), // to avoid duplicated keys
            })
        )
    }
    return assistants;
};

export const getProjectInstallers = (project, CONFIG, date=null) => {
    // const users = project?.projectDefaultTasks?.filter(
    //     (task) => task.project_default_task.project_stage.name === CONFIG.stages.installation &&
    //         task.project_default_task.name.toLowerCase().includes('start')
    // )[0]?.users_assignees

    // const installer = users?.filter(
    //     (user) => {
    //         const objRole = user?.userRole || user?.user_role;
    //         return objRole.name.toLowerCase().includes(CONFIG.roles.installer.toLowerCase())
    //     }
    // )[0] || project?.userInstaller;

    // return installer;
    const workOrders = getWorkOrders(project, date, CONFIG.stages.installation);
    const installers = workOrders.map(
        (wo) => (wo.users_assignees || wo.usersAssignees || [])
    ).flat();

    const set = new Set();
    const uniqueInstallers = installers.filter((user) => {
        const notAdded = !set.has(user.username);
        if (notAdded) {
            set.add(user.username);
            return true;
        }
        return false;
    });
    return uniqueInstallers;
};


export const filteredDescription = (description) => description
    .split('\n')
    .filter(line => {
        const parts = line.split(':');
        return parts.length < 2 || parts[1].trim() !== '';
    })
    .join('\n');


export const filteredSomeDescription = (description, someFields) => description
    .split('\n')
    .filter(line => {
        const parts = line.split(':');
        return parts.length < 2 || (parts[1].trim() !== '' && someFields.some(field => parts[0].trim().toLowerCase().includes(field.toLowerCase())));
    })
    .join('\n');


export const filteredDescriptionJson = (description) => description
    .split('\n')
    .map(line => line.split(':'))
    .filter(parts => parts.length >= 2 && parts[1].trim() !== '')
    .reduce((acc, parts) => {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        acc[key] = value;
        return acc;
    }, {});

export const previousTasks = (task, projectTasks, inStagePermission, CONFIG) => {
    const tasks = inStagePermission ?
        projectTasks?.filter(
            (t) => t.project_default_task.order < task.project_default_task.order &&
                t.project_default_task?.project_stage?.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) !== -1
        ) :
        projectTasks?.filter(
            (t) => t.project_default_task.order < task.project_default_task.order &&
                t.project_default_task?.project_stage?.name.toLowerCase().indexOf(CONFIG.stages.permission.toLowerCase()) === -1
        );
    return tasks;
}

export const previousTasksInStatus = (task, projectTasks, status, inStagePermission, CONFIG) => {
    const tasks = previousTasks(task, projectTasks, inStagePermission, CONFIG);
    return tasks?.filter((t) => t.status === status);
}



/**
 * @param {Array<Object>} productData        // tu primer array
 * @param {Array<Object>} loadedDefaultMaterials  // tu segundo array
 * @returns {Array<Object<{id,name,quantity,ticket,cost,store,notes}>>}
 */
export function buildMaterialsReport(productData, loadedDefaultMaterials) {
    const THRESHOLD = 0.8;
    const items = loadedDefaultMaterials.flatMap(mat => {
        const matches = mat.defaultGuideProducts.filter(dgp => {
            if (productData.some(pd => pd.id === dgp.order)) return true;
            return productData.some(pd =>
                stringSimilarity.compareTwoStrings(dgp.name.toLowerCase(), pd.name.toLowerCase()) >= THRESHOLD
            );
        });
        return matches.map(dgp => {
            const pd = productData.find(pdi =>
                pdi.id === dgp.order ||
                stringSimilarity.compareTwoStrings(dgp.name.toLowerCase(), pdi.name.toLowerCase()) >= THRESHOLD
            );
            const baseQty = mat.quantity * pd.quantity;
            const quantity = mat.isPackaged
                ? Math.ceil(baseQty / mat.packageQuantity)
                : baseQty;
            return {
                id: mat.id,
                name: mat.name,
                quantity,
                ticket: '',
                cost: mat.price,
                store: '',
                notes: pd.notes
            };
        });
    });
    const grouped = items.reduce((acc, cur) => {
        if (!acc[cur.id]) acc[cur.id] = { ...cur };
        else acc[cur.id].quantity += cur.quantity;
        return acc;
    }, {});
    return Object.values(grouped);
}


export function getProjectAttachments(project, stageName = null) {
    const allAttachments = {
        project: [],
        tasks: [],
    }
    const projectAttachments = (stageName ?
        project?.projectAttachments?.filter(
            (attachment) => attachment?.current_stage?.name.toLowerCase() === stageName.toLowerCase()
        ) :
        project?.projectAttachments) || [];

    const tasksAttachments = stageName ?
        project?.projectDefaultTasks?.filter(
            (task) => task?.project_default_task?.has_attachments &&
                task?.project_task_attachments?.some(
                    // (attachment) => attachment?.due_project_stage?.name.toLowerCase() === stageName.toLowerCase()
                    (attachment) => attachment?.project_task?.project_default_task?.project_stage?.name.toLowerCase() === stageName.toLowerCase()
                )).map((task) => task?.project_task_attachments).flat() :
        project?.projectDefaultTasks?.filter(
            (task) => task?.project_default_task?.has_attachments || task?.project_task_attachments?.length > 0
        ).map((task) => task?.project_task_attachments).flat();

    allAttachments.project = projectAttachments;
    allAttachments.tasks = tasksAttachments;

    return allAttachments;
}

export function getProjectCrewTypes(project) {
    const crewTypesSet = new Set();
    project?.workOrders?.forEach((wo) => {
        const installerCrews = wo?.installerCrews || wo?.installer_crews || [];
        installerCrews.forEach((crew) => {
            if (crew?.typeCrew || crew?.type_crew) {
                crewTypesSet.add(crew.typeCrew?.value || crew.type_crew?.value);
            }
        });
        const usersAssignees = wo?.users_assignees || wo?.usersAssignees || [];
        usersAssignees.forEach((user) => {
            const installerInfo = user?.installerInfo || user?.installer_info;
            if (installerInfo?.typeCrew || installerInfo?.type_crew) {
                crewTypesSet.add(installerInfo?.typeCrew?.value || installerInfo?.type_crew?.value);
            }
        });
    });
    return Array.from(crewTypesSet);
}