// class DBService {
//   constructor(model) {
//     this.model = model;
//   }

//   async create(data) {
//     return await this.model.create(data);
//   }
//    async find(filter, populate = []) {
//     return await this.model.find(filter).populate(populate);
//   }
//   async findOne(filter, populate = []) {
//     return await this.model.findOne(filter).populate(populate);
//   }

//   async findById(id, populate = []) {
//     return await this.model.findById(id).populate(populate);
//   }

//   async findAll(filter = {}, populate = []) {
//     return await this.model.find(filter).populate(populate);
//   }

//   async update(filter, data) {
//     return await this.model.findOneAndUpdate(filter, data, {
//       returnDocument: 'after',
//     });
//   }

//   async delete(filter) {
//     return await this.model.findOneAndDelete(filter);
//   }

//   // UPDATE
//   async updateOne(filter, data, options = {}) {
//     return await this.model.updateOne(filter, data, options);
//   }

//   async updateById(id, data, options = { new: true }) {
//     return await this.model.findByIdAndUpdate(id, data, options);
//   }

//   async findOneAndUpdate(filter, data, options = { new: true }) {
//     return await this.model.findOneAndUpdate(filter, data, options);
//   }
//   async findByIdAndUpdate(id, data, options = { new: true }) {
//     return await this.model.findByIdAndUpdate(id, data, options);
//   }
//   // DELETE
//   async deleteOne(filter) {
//     return await this.model.findOneAndDelete(filter);
//   }

//   async deleteById(id) {
//     return await this.model.findByIdAndDelete(id);
//   }
// }

// export default DBService;
