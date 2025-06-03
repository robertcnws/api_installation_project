export const getMeasurementStatus = (marks) => {
    const numberOfChecked = marks?.filter(mark => mark.second_check).length || 0;
    return numberOfChecked === marks?.length ? 'finished' :
        numberOfChecked > 0 ? 'in progress' : 'not started';
}