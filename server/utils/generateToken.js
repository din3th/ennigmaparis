import jwt from 'jsonwebtoken';

const generateToken = (id, extra = {}) => {
  return jwt.sign({ id, ...extra }, process.env.JWT_SECRET || 'supersecretjwtkeythatshouldbechanged', {
    expiresIn: '30d',
  });
};


export default generateToken;
